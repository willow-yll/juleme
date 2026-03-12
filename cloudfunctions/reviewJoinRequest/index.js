const { db, nowIso, getContext, ensureUser, requireCircleOwner, getPendingJoinRequest, requireCircle, toMemberSnapshot, COLLECTIONS } = require('./db');

exports.main = async (event) => {
  const { circleId, requestId, status } = event;
  if (!circleId || !requestId) {
    throw new Error('缺少申请参数');
  }
  if (!['approved', 'rejected'].includes(status)) {
    throw new Error('非法的审批状态');
  }

  const { OPENID } = getContext();
  await ensureUser(OPENID);
  await requireCircleOwner(circleId, OPENID);

  const requestRes = await db.collection(COLLECTIONS.CIRCLE_JOIN_REQUESTS).doc(requestId).get().catch(() => null);
  const request = requestRes && requestRes.data ? requestRes.data : null;
  if (!request || request.circleId !== circleId) {
    throw new Error('申请不存在');
  }
  if (request.status !== 'pending') {
    throw new Error('申请已处理');
  }

  const updatedAt = nowIso();
  await db.collection(COLLECTIONS.CIRCLE_JOIN_REQUESTS).doc(requestId).update({
    data: {
      status,
      updatedAt,
      reviewedBy: OPENID,
      reviewedAt: updatedAt
    }
  });

  if (status === 'approved') {
    const userRes = await db.collection(COLLECTIONS.USERS).doc(request.applicantId).get().catch(() => null);
    const userProfile = userRes && userRes.data ? userRes.data : null;
    if (!userProfile) {
      throw new Error('申请用户资料不存在');
    }

    const existingMember = await db.collection(COLLECTIONS.CIRCLE_MEMBERS).where({
      circleId,
      userId: request.applicantId,
      status: 'active'
    }).get();

    if (!(existingMember.data || []).length) {
      await db.collection(COLLECTIONS.CIRCLE_MEMBERS).add({
        data: {
          circleId,
          ...toMemberSnapshot(userProfile, 'member'),
          status: 'active',
          createdAt: updatedAt,
          updatedAt
        }
      });
    }

    const circle = await requireCircle(circleId);
    await db.collection(COLLECTIONS.CIRCLES).doc(circleId).update({
      data: {
        memberCount: (circle.memberCount || 0) + ((existingMember.data || []).length ? 0 : 1),
        updatedAt
      }
    });

    await db.collection(COLLECTIONS.FEED_EVENTS).add({
      data: {
        circleId,
        type: 'circle',
        content: '加入了圈子',
        title: request.applicantName || '新成员',
        userId: request.applicantId,
        userName: request.applicantName || '未命名用户',
        userAvatar: request.applicantAvatar || '',
        likes: 0,
        comments: [],
        displayTime: '刚刚',
        createdAt: updatedAt,
        updatedAt
      }
    });
  }

  return {
    requestId,
    status
  };
};
