const { db, nowIso, getContext, ensureUser, getMembership, requireCircle, COLLECTIONS } = require('./db');

exports.main = async (event) => {
  const { circleId } = event;
  if (!circleId) {
    throw new Error('缺少圈子参数');
  }

  const { OPENID } = getContext();
  const userProfile = await ensureUser(OPENID);
  const membership = await getMembership(circleId, OPENID);
  if (!membership) {
    throw new Error('你还不是该圈子成员');
  }
  if (membership.role === 'owner') {
    throw new Error('圈主暂不支持直接退圈，请先处理圈子后再操作');
  }

  const circle = await requireCircle(circleId);
  const updatedAt = nowIso();

  await db.collection(COLLECTIONS.CIRCLE_MEMBERS).doc(membership._id).update({
    data: {
      status: 'left',
      updatedAt,
      leftAt: updatedAt
    }
  });

  const activeClaims = await db.collection(COLLECTIONS.WISH_CLAIMS).where({
    circleId,
    userId: OPENID,
    status: 'active'
  }).get();

  await Promise.all((activeClaims.data || []).map((item) => db.collection(COLLECTIONS.WISH_CLAIMS).doc(item._id).update({
    data: {
      status: 'cancelled',
      updatedAt,
      cancelledBy: OPENID,
      cancelReason: 'leave_circle'
    }
  })));

  const nextMemberCount = Math.max((circle.memberCount || 1) - 1, 0);
  await db.collection(COLLECTIONS.CIRCLES).doc(circleId).update({
    data: {
      memberCount: nextMemberCount,
      updatedAt
    }
  });

  await db.collection(COLLECTIONS.FEED_EVENTS).add({
    data: {
      circleId,
      type: 'circle',
      content: '退出了圈子',
      title: userProfile.nickname || '圈友',
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

  return {
    left: true,
    circleId,
    cancelledClaims: (activeClaims.data || []).length,
    memberCount: nextMemberCount
  };
};
