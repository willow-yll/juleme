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
  '你不是数据播报员，你的任务不是复述统计结果，而是从数据里提炼 2-3 个最有记忆点的观察。',
  '你只能基于我提供的圈子聚合数据进行分析，不要编造不存在的成员信息、活动经历或关系。',
  '请只输出最终结论，不要展示分析过程。',
  '强约束：',
  '1. 总共只写 2 到 3 句，总字数控制在 80-100 字之间。',
  '2. 不能直接复述人数、占比、排行榜名称、MBTI 分布、星座分布等原始统计。',
  '3. 禁止出现以下表达：',
  '   - “圈子共有……”',
  '   - “根据数据显示……”',
  '   - “从数据来看……”',
  '   - “MBTI 分布为……”',
  '   - “星座分布为……”',
  '   - “男女比例……”',
  '4. 每一句都必须是“观察”而不是“报数”。',
  '5. 判断这个圈子的星座特征和MBTI特征。',
  '6. 必须加入 1 句 MBTI + 星座的组合洞察。',
  '7. 如果特征不够明显，就只说“偏”“更像”“有点像”，不要下绝对结论。',
  '推荐结构：',
  '   - 第 1 句：一句话写这个圈子的星座组合特征。',
  '   - 第 2 句：一句话写这个圈子的MBTI组合特征。',
  '   - 第 3 句：一句话写 MBTI + 星座组合洞察。',
  '风格要求：像朋友的观察，简短、有趣、有温度，不油腻、不矫情。'
].join('\n');

module.exports = {
  COLLECTIONS,
  DEFAULT_AVATAR,
  CIRCLE_REPORT_PROMPT
};
