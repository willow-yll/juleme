const { db, nowIso, getContext, ensureUser, requireCircleOwner, getMembership, COLLECTIONS } = require('../common/db');

exports.main = async (event) => {
  const { circleId, wishId } = event;
  if (!circleId || !wishId) {
    throw new Error('缺少活动参数');
  }

  const { OPENID } = getContext();
  const userProfile = await ensureUser(OPENID);

  const wishRes = await db.collection(COLLECTIONS.WISHES).doc(wishId).get().catch(() => null);
  const wish = wishRes && wishRes.data ? wishRes.data : null;
  if (!wish || wish.circleId !== circleId || wish.status === 'deleted') {
    throw new Error('活动不存在');
  }

  const membership = await getMembership(circleId, OPENID);
  if (!membership) {
    throw new Error('你还不是该圈子成员');
  }

  const isCreator = wish.creatorId === OPENID;
  const isOwner = membership.role === 'owner';
  if (!isCreator && !isOwner) {
    throw new Error('只有活动发起人或圈主可以删除活动');
  }

  const updatedAt = nowIso();
  await db.collection(COLLECTIONS.WISHES).doc(wishId).update({
    data: {
      status: 'deleted',
      updatedAt,
      deletedBy: OPENID
    }
  });

  const claimRes = await db.collection(COLLECTIONS.WISH_CLAIMS).where({ circleId, wishId, status: 'active' }).get();
  await Promise.all((claimRes.data || []).map((item) => db.collection(COLLECTIONS.WISH_CLAIMS).doc(item._id).update({
    data: {
      status: 'cancelled',
      updatedAt
    }
  })));

  await db.collection(COLLECTIONS.FEED_EVENTS).add({
    data: {
      circleId,
      type: 'wish',
      content: '删除了活动',
      title: wish.title,
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

  return { deleted: true };
};
