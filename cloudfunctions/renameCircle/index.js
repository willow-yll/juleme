const { db, nowIso, getContext, ensureUser, requireCircleOwner, COLLECTIONS } = require('./db');

exports.main = async (event) => {
  const { circleId, name } = event;
  const trimmedName = String(name || '').trim();
  if (!circleId) {
    throw new Error('缺少圈子ID');
  }
  if (!trimmedName) {
    throw new Error('请输入圈子名称');
  }

  const { OPENID } = getContext();
  const userProfile = await ensureUser(OPENID);
  await requireCircleOwner(circleId, OPENID);

  const updatedAt = nowIso();
  await db.collection(COLLECTIONS.CIRCLES).doc(circleId).update({
    data: {
      name: trimmedName,
      updatedAt
    }
  });

  await db.collection(COLLECTIONS.FEED_EVENTS).add({
    data: {
      circleId,
      type: 'circle',
      content: '修改了圈名',
      title: trimmedName,
      userId: OPENID,
      userName: userProfile.nickname || '未命名用户',
      userAvatar: userProfile.avatar || '',
      likes: 0,
      comments: [],
      displayTime: '刚刚',
      createdAt: updatedAt,
      updatedAt
    }
  });

  return { circleId, name: trimmedName };
};
