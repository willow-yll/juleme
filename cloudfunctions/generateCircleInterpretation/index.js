const { db, getContext, ensureUser, requireMembership, buildCircleContent, CIRCLE_REPORT_PROMPT, COLLECTIONS } = require('./db');

function buildUserPrompt(payload) {
  return [
    `圈子名称：${payload.circleName}`,
    `圈友人数：${payload.memberCount}`,
    `统计数据：${JSON.stringify(payload.stats)}`,
    `性别分布：${JSON.stringify(payload.analysis.gender)}`,
    `MBTI 分布：${JSON.stringify(payload.analysis.mbti)}`,
    `星座分布：${JSON.stringify(payload.analysis.constellation)}`,
    `荣誉榜：${JSON.stringify(payload.leaderboard)}`
  ].join('\n');
}

function buildSummary(content) {
  const members = content.members || [];
  const wishes = content.wishes || [];
  const genderMap = {};
  const mbtiMap = {};
  const constellationMap = {};
  const memberStats = {};

  members.forEach((member) => {
    const genderLabel = member.gender || '未设置';
    genderMap[genderLabel] = (genderMap[genderLabel] || 0) + 1;
    if (member.mbti) {
      mbtiMap[member.mbti] = (mbtiMap[member.mbti] || 0) + 1;
    }
    if (member.constellation) {
      constellationMap[member.constellation] = (constellationMap[member.constellation] || 0) + 1;
    }
    memberStats[member.id] = {
      name: member.name,
      eventsJoined: 0,
      eventsCreated: 0,
      diningCount: 0
    };
  });

  wishes.forEach((wish) => {
    if (wish.creator && memberStats[wish.creator.id]) {
      memberStats[wish.creator.id].eventsCreated += 1;
    }
    (wish.claimed || []).forEach((claim) => {
      if (claim.user && memberStats[claim.user.id]) {
        memberStats[claim.user.id].eventsJoined += 1;
        if (wish.category === 'restaurant') {
          memberStats[claim.user.id].diningCount += 1;
        }
      }
    });
  });

  const statsArray = Object.values(memberStats);
  const pickMax = (key) => {
    if (!statsArray.length) return null;
    return statsArray.reduce((max, item) => item[key] > max[key] ? item : max, statsArray[0]);
  };

  const now = new Date();
  const totalGatherings = wishes.filter((wish) => wish.targetDate && new Date(wish.targetDate) < now).length;
  const totalDishes = wishes.filter((wish) => wish.category === 'restaurant').length;
  const totalCities = wishes.filter((wish) => wish.category === 'travel').length;

  return {
    circleName: content.circle ? content.circle.name : '未命名圈子',
    memberCount: members.length,
    analysis: {
      gender: Object.entries(genderMap).map(([name, count]) => ({ name, count })),
      mbti: Object.entries(mbtiMap).map(([name, count]) => ({ name, count })),
      constellation: Object.entries(constellationMap).map(([name, count]) => ({ name, count }))
    },
    leaderboard: {
      partyKing: pickMax('eventsJoined'),
      foodKing: pickMax('diningCount'),
      organizerKing: pickMax('eventsCreated')
    },
    stats: {
      totalGatherings,
      totalDishes,
      totalCities
    }
  };
}

function extractMessageContent(data) {
  const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (typeof content === 'string') {
    return content.trim();
  }
  if (Array.isArray(content)) {
    return content.map((item) => item && item.text ? item.text : '').join('').trim();
  }
  return '';
}

exports.main = async (event) => {
  const { circleId } = event;
  if (!circleId) {
    throw new Error('缺少圈子ID');
  }

  const { OPENID } = getContext();
  await ensureUser(OPENID);
  await requireMembership(circleId, OPENID);

  const content = await buildCircleContent(circleId, OPENID);
  const payload = buildSummary(content);
  if (!payload.memberCount) {
    throw new Error('当前圈子还没有圈友数据，先邀请成员加入后再试试。');
  }

  const configRes = await db.collection(COLLECTIONS.USERS).doc(OPENID).get().catch(() => null);
  void configRes;

  const apiKey = process.env.BAILIAN_API_KEY;
  const model = process.env.BAILIAN_MODEL || 'qwen-plus';
  const baseUrl = process.env.BAILIAN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
  if (!apiKey) {
    throw new Error('云函数环境变量中未配置 BAILIAN_API_KEY');
  }

  const response = await new Promise((resolve, reject) => {
    require('https').request(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      }
    }, (res) => {
      let raw = '';
      res.on('data', (chunk) => {
        raw += chunk;
      });
      res.on('end', () => {
        try {
          const data = JSON.parse(raw || '{}');
          if (res.statusCode < 200 || res.statusCode >= 300) {
            reject(new Error(data.message || '百炼服务请求失败，请稍后重试。'));
            return;
          }
          resolve(data);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject).end(JSON.stringify({
      model,
      messages: [
        { role: 'system', content: CIRCLE_REPORT_PROMPT },
        { role: 'user', content: buildUserPrompt(payload) }
      ],
      temperature: 0.7
    }));
  });

  const text = extractMessageContent(response);
  if (!text) {
    throw new Error('百炼返回内容为空，请稍后重试。');
  }

  return { text, payload };
};
