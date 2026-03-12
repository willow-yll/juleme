const { db, nowIso, getContext, ensureUser, requireMembership, requireCircle, COLLECTIONS } = require('./db');

exports.main = async (event) => {
  const { circleId, wishId, action } = event;
  if (!circleId || !wishId) {
    throw new Error('缺少活动参数');
  }
  if (!['claim', 'cancel'].includes(action)) {
    throw new Error('非法的报名操作');
  }

  const { OPENID } = getContext();
  const userProfile = await ensureUser(OPENID);
  await requireMembership(circleId, OPENID);
  await requireCircle(circleId);

  const wishRes = await db.collection(COLLECTIONS.WISHES).doc(wishId).get().catch(() => null);
  const wish = wishRes && wishRes.data ? wishRes.data : null;
  if (!wish || wish.circleId !== circleId || wish.status === 'deleted') {
    throw new Error('活动不存在');
  }

  const claimQuery = await db.collection(COLLECTIONS.WISH_CLAIMS).where({
    circleId,
    wishId,
    userId: OPENID,
    status: 'active'
  }).get();
  const existing = claimQuery.data && claimQuery.data[0] ? claimQuery.data[0] : null;

  if (action === 'claim') {
    if (existing) {
      throw new Error('已经报名过了');
    }

    const activeClaims = await db.collection(COLLECTIONS.WISH_CLAIMS).where({
      circleId,
      wishId,
      status: 'active'
    }).get();

    if ((activeClaims.data || []).length >= (wish.maxClaim || 0)) {
      throw new Error('名额已满啦');
    }

    const createdAt = nowIso();
    await db.collection(COLLECTIONS.WISH_CLAIMS).add({
      data: {
        circleId,
        wishId,
        userId: OPENID,
        userName: userProfile.nickname || '未命名用户',
        userAvatar: userProfile.avatar || '',
        status: 'active',
        createdAt,
        updatedAt: createdAt
      }
    });

    await db.collection(COLLECTIONS.FEED_EVENTS).add({
      data: {
        circleId,
        type: 'wish',
        content: '报名了活动',
        title: wish.title,
        userId: OPENID,
        userName: userProfile.nickname || '未命名用户',
        userAvatar: userProfile.avatar || '',
        likes: 0,
        comments: [],
        displayTime: '刚刚',
        createdAt,
        updatedAt: createdAt
      }
    });

    return { claimed: true };
  }

  if (!existing) {
    throw new Error('你还没有报名该活动');
  }

  await db.collection(COLLECTIONS.WISH_CLAIMS).doc(existing._id).update({
    data: {
      status: 'cancelled',
      updatedAt: nowIso()
    }
  });

  return { claimed: false };
};
