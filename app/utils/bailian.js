const {
  BAILIAN_BASE_URL,
  BAILIAN_MODEL,
  BAILIAN_API_KEY,
  CIRCLE_REPORT_PROMPT
} = require('./bailianConfig');

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

function extractMessageContent(data) {
  const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (typeof content === 'string') {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map(item => item && item.text ? item.text : '')
      .join('')
      .trim();
  }

  return '';
}

function generateCircleInterpretation(payload) {
  return new Promise((resolve, reject) => {
    if (!BAILIAN_API_KEY) {
      reject(new Error('请先在 app/utils/bailianConfig.js 的 BAILIAN_API_KEY 中填写阿里云百炼 API Key。'));
      return;
    }

    wx.request({
      url: BAILIAN_BASE_URL,
      method: 'POST',
      timeout: 20000,
      header: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${BAILIAN_API_KEY}`
      },
      data: {
        model: BAILIAN_MODEL,
        messages: [
          {
            role: 'system',
            content: CIRCLE_REPORT_PROMPT
          },
          {
            role: 'user',
            content: buildUserPrompt(payload)
          }
        ],
        temperature: 0.7
      },
      success(res) {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          const message = res.data && res.data.message
            ? res.data.message
            : '百炼服务请求失败，请稍后重试。';
          reject(new Error(message));
          return;
        }

        const text = extractMessageContent(res.data);
        if (!text) {
          reject(new Error('百炼返回内容为空，请调整 Prompt 或稍后重试。'));
          return;
        }

        resolve(text);
      },
      fail(error) {
        reject(new Error(error && error.errMsg ? error.errMsg : '网络异常，请检查后重试。'));
      }
    });
  });
}

module.exports = {
  generateCircleInterpretation
};