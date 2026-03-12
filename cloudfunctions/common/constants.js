const COLLECTIONS = {
  USERS: 'users',
  CIRCLES: 'circles',
  CIRCLE_MEMBERS: 'circle_members',
  CIRCLE_JOIN_REQUESTS: 'circle_join_requests',
  WISHES: 'wishes',
  WISH_CLAIMS: 'wish_claims',
  ANNIVERSARIES: 'anniversaries',
  FEED_EVENTS: 'feed_events'
};

const DEFAULT_AVATAR = 'https://picsum.photos/100';

const CIRCLE_REPORT_PROMPT = [
  '你是一个擅长做圈子画像分析的助手。',
  '你只能基于我提供的圈子聚合数据进行分析，不要编造不存在的成员信息、活动经历或关系。',
  '请用简洁、友好的中文输出，分成以下 4 个部分：',
  '1. 圈子画像',
  '2. 活跃特点',
  '3. 有趣发现',
  '4. 下次活动建议',
  '如果数据不足，请直接说明样本有限，并基于已有信息给出谨慎判断。',
  '每个部分控制在 1-2 句话，整体适合直接展示在小程序卡片里。'
].join('\n');

module.exports = {
  COLLECTIONS,
  DEFAULT_AVATAR,
  CIRCLE_REPORT_PROMPT
};
