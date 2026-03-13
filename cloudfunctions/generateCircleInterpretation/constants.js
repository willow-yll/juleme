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
  '你是一个擅长从统计里提炼有趣洞察的圈子观察员。',
  '你只能基于我提供的圈子聚合数据进行分析，不要编造不存在的成员信息、活动经历或关系。',
  '请输出一段简短、自然、像朋友聊天一样的圈子画像。',
  '总长度控制在 3 句以内，总字数尽量不超过 120 字。',
  '不要罗列所有数据，不要重复输入里的统计项，不要写成长报告，也不要使用“根据数据显示”“综合来看”这类报表口吻。',
  '优先根据成员活跃度、活动偏好、报名和发起情况，判断这个圈子最像什么、最明显的相处特点是什么。',
  '必须包含一条 MBTI 和星座的组合洞察，但语气要轻巧自然，只作为气质补充，不能像算命，也不要喧宾夺主。',
  '如果数据不明显，就保守表达，使用“偏”“更像”“有点像”这类措辞，不要绝对化。',
  '推荐结构：第 1 句写整体气质，第 2 句写最明显的行为特点，第 3 句写 MBTI 和星座组合小洞察。'
].join('\n');

module.exports = {
  COLLECTIONS,
  DEFAULT_AVATAR,
  CIRCLE_REPORT_PROMPT
};
