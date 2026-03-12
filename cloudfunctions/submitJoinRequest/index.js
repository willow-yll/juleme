const { db, nowIso, getContext, ensureUser, getMembership, getPendingJoinRequest, COLLECTIONS, requireCircle } = require('./db');

exports.main = async (event) => {
  const code = String(event.code || '').trim();
  if (!/^\d{6}$/.test(code)) {
    throw new Error('请输入6位圈子号码');
  }

  const { OPENID } = getContext();
  const userProfile = await ensureUser(OPENID);
  if (!userProfile.nickname) {
    throw new Error('请先完善个人资料');
  }

  const circleRes = await db.collection(COLLECTIONS.CIRCLES).where({ code }).get();
  const circle = circleRes.data && circleRes.data[0] ? circleRes.data[0] : null;
  if (!circle) {
    throw new Error('圈子不存在');
  }

  await requireCircle(circle._id);

  if (circle.ownerId === OPENID) {
    throw new Error('这是你自己的圈子');
  }

  const existingMember = await getMembership(circle._id, OPENID);
  if (existingMember) {
    throw new Error('你已加入该圈子');
  }

  const pending = await getPendingJoinRequest(circle._id, OPENID);
  if (pending) {
    throw new Error('已有待处理的申请，请耐心等待');
  }

  const createdAt = nowIso();
  const result = await db.collection(COLLECTIONS.CIRCLE_JOIN_REQUESTS).add({
    data: {
      circleId: circle._id,
      circleName: circle.name,
      applicantId: OPENID,
      applicantName: userProfile.nickname,
      applicantAvatar: userProfile.avatar,
      applicantGender: userProfile.gender || '',
      applicantMbti: userProfile.mbti || '',
      applicantConstellation: userProfile.constellation || '',
      status: 'pending',
      createdAt,
      updatedAt: createdAt
    }
  });

  return {
    requestId: result._id,
    circleId: circle._id,
    circleName: circle.name
  };
};
