const { db, getContext, ensureUser, requireMembership, buildCircleContent, CIRCLE_REPORT_PROMPT, COLLECTIONS } = require('./db');

function buildUserPrompt(payload) {
  const genderTop = payload.analysis.gender.slice(0, 2).map((item) => `${item.name}${item.count ? `（${item.count}人）` : ''}`).join('、') || '暂无明显特征';
  const mbtiTop = payload.analysis.mbti.slice(0, 2).map((item) => `${item.name}${item.count ? `（${item.count}人）` : ''}`).join('、') || '暂无明显特征';
  const constellationTop = payload.analysis.constellation.slice(0, 2).map((item) => `${item.name}${item.count ? `（${item.count}人）` : ''}`).join('、') || '暂无明显特征';
  const topActivity = payload.stats.totalDishes >= payload.stats.totalCities
    ? '聚会更偏向吃饭型'
    : '聚会更偏向旅行型';
  const memberActivity = payload.stats.totalGatherings > payload.memberCount
    ? '圈友响应积极'
    : '活动节奏偏稳';

  return [
    '你要分析的是一个圈子的相处气质，不是汇报统计表。',
    '',
    `圈子名称：${payload.circleName}`,
    `成员规模：${payload.memberCount}人`,
    `活动倾向：${topActivity}`,
    `相处节奏：${memberActivity}`,
    `最近的标签线索：MBTI 更集中在 ${mbtiTop}；星座气质更偏 ${constellationTop}；性别分布可参考 ${genderTop}`,
    `圈内角色线索：最会响应的是${payload.leaderboard.partyKing ? payload.leaderboard.partyKing.name : '暂无明显人物'}，最会组织的是${payload.leaderboard.organizerKing ? payload.leaderboard.organizerKing.name : '暂无明显人物'}，最像干饭搭子的是${payload.leaderboard.foodKing ? payload.leaderboard.foodKing.name : '暂无明显人物'}`,
    '请不要复述上面的字段内容，而是只提炼出：这个圈子最像什么、最明显的相处特点、以及一句 MBTI+星座组合洞察。'
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

function stripThinkingTags(text) {
  if (!text) return '';
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
    .trim();
}

function extractMessageContent(data) {
  const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (typeof content === 'string') {
    return stripThinkingTags(content.trim());
  }
  if (Array.isArray(content)) {
    return stripThinkingTags(content.map((item) => item && item.text ? item.text : '').join('').trim());
  }
  return '';
}

function buildModelProviderError(res, data, raw) {
  const statusCode = res && res.statusCode ? res.statusCode : 0;
  const requestId = data && (data.request_id || data.requestId || data.id) ? (data.request_id || data.requestId || data.id) : '';
  const code = data && (data.code || data.error && data.error.code) ? (data.code || data.error.code) : '';
  const message = data && (data.message || data.error && data.error.message) ? (data.message || data.error.message) : '';
  const details = [
    `HTTP ${statusCode}`,
    code ? `code=${code}` : '',
    requestId ? `request_id=${requestId}` : '',
    message || (raw ? `raw=${raw}` : '')
  ].filter(Boolean).join(' | ');
  return new Error(`大模型服务请求失败：${details}`);
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

  const apiKey = process.env.OPENAI_API_KEY || process.env.BAILIAN_API_KEY;
  const model = process.env.OPENAI_MODEL || process.env.BAILIAN_MODEL || 'gpt-4o-mini';
  const baseUrl = process.env.OPENAI_BASE_URL || process.env.BAILIAN_BASE_URL || 'https://api.openai.com/v1/chat/completions';
  if (!apiKey) {
    throw new Error('云函数环境变量中未配置 OPENAI_API_KEY');
  }

  const response = await new Promise((resolve, reject) => {
    const requestBody = JSON.stringify({
      model,
      messages: [
        { role: 'system', content: CIRCLE_REPORT_PROMPT },
        { role: 'user', content: buildUserPrompt(payload) }
      ],
      temperature: 0.7
    });
    const parsedUrl = new URL(baseUrl);
    const requestLib = parsedUrl.protocol === 'http:' ? require('http') : require('https');

    console.log('generateCircleInterpretation request', {
      circleId,
      model,
      baseUrl,
      protocol: parsedUrl.protocol,
      memberCount: payload.memberCount
    });

    const request = requestLib.request(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(requestBody)
      },
      timeout: 15000
    }, (res) => {
      let raw = '';
      res.on('data', (chunk) => {
        raw += chunk;
      });
      res.on('end', () => {
        try {
          const data = JSON.parse(raw || '{}');
          if (res.statusCode < 200 || res.statusCode >= 300) {
            console.error('generateCircleInterpretation response error', {
              statusCode: res.statusCode,
              data
            });
            reject(buildModelProviderError(res, data, raw));
            return;
          }
          console.log('generateCircleInterpretation response ok', {
            statusCode: res.statusCode,
            requestId: data.request_id || data.requestId || ''
          });
          resolve(data);
        } catch (error) {
          console.error('generateCircleInterpretation parse error', {
            statusCode: res.statusCode,
            raw
          });
          reject(new Error(`大模型服务返回解析失败：HTTP ${res.statusCode || 0}`));
        }
      });
    });

    request.on('timeout', () => {
      request.destroy(new Error('大模型服务请求超时（15s）'));
    });
    request.on('error', (error) => {
      console.error('generateCircleInterpretation request error', error);
      reject(error);
    });
    request.end(requestBody);
  });

  const text = extractMessageContent(response);
  if (!text) {
    throw new Error('百炼返回内容为空，请稍后重试。');
  }

  return { text, payload };
};
