const { db, nowIso, getContext, ensureUser, requireMembership, addFeedEvent, getCategoryText, COLLECTIONS } = require('../common/db');

exports.main = async (event) => {
  const { circleId, title, description = '', category = 'other', targetDate = '', maxClaim = 5 } = event;
  const trimmedTitle = String(title || '').trim();
  if (!circleId) {
    throw new Error('缺少圈子ID');
  }
  if (!trimmedTitle) {
    throw new Error('请输入活动标题');
  }

  const { OPENID } = getContext();
  const userProfile = await ensureUser(OPENID);
  await requireMembership(circleId, OPENID);

  const createdAt = nowIso();
  const result = await db.collection(COLLECTIONS.WISHES).add({
    data: {
      circleId,
      title: trimmedTitle,
      description: String(description || '').trim(),
      category,
      categoryText: getCategoryText(category),
      creatorId: OPENID,
      creatorName: userProfile.nickname || '未命名用户',
      creatorAvatar: userProfile.avatar || '',
      targetDate: targetDate || '',
      maxClaim: Number(maxClaim) || 0,
      likes: 0,
      status: 'active',
      createdAt,
      updatedAt: createdAt
    }
  });

  await addFeedEvent({
    circleId,
    type: 'wish',
    content: '发起了新活动',
    title: trimmedTitle,
    userProfile
  });

  return {
    wishId: result._id
  };
};
