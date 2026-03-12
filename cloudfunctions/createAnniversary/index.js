const { db, nowIso, getContext, ensureUser, requireMembership, addFeedEvent, COLLECTIONS } = require('../common/db');

exports.main = async (event) => {
  const { circleId, name, type, date = '', cycleType = 'weekly', cycleValue = null, nextDate = '', enabled = true, icon = '🎉' } = event;
  const trimmedName = String(name || '').trim();
  if (!circleId) {
    throw new Error('缺少圈子ID');
  }
  if (!trimmedName) {
    throw new Error('请输入名称');
  }
  if (!type) {
    throw new Error('缺少纪念日类型');
  }

  const { OPENID } = getContext();
  const userProfile = await ensureUser(OPENID);
  await requireMembership(circleId, OPENID);

  const createdAt = nowIso();
  const result = await db.collection(COLLECTIONS.ANNIVERSARIES).add({
    data: {
      circleId,
      creatorId: OPENID,
      creatorName: userProfile.nickname || '未命名用户',
      name: trimmedName,
      type,
      date,
      cycleType,
      cycleValue,
      nextDate,
      enabled,
      icon,
      status: 'active',
      createdAt,
      updatedAt: createdAt
    }
  });

  await addFeedEvent({
    circleId,
    type: 'anniversary',
    content: '设置了新纪念日',
    title: trimmedName,
    userProfile
  });

  return { anniversaryId: result._id };
};
