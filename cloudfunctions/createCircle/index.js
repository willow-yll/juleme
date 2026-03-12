const { db, nowIso, getContext, ensureUser, toMemberSnapshot, generateUniqueCircleCode, COLLECTIONS } = require('../common/db');

exports.main = async (event) => {
  const { name, description = '', color = '#9B7DED' } = event;
  if (!name || !String(name).trim()) {
    throw new Error('请输入圈子名称');
  }

  const { OPENID } = getContext();
  const userProfile = await ensureUser(OPENID);
  if (!userProfile.nickname) {
    throw new Error('请先完善个人资料');
  }

  const code = await generateUniqueCircleCode();
  const createdAt = nowIso();
  const circleRes = await db.collection(COLLECTIONS.CIRCLES).add({
    data: {
      name: String(name).trim(),
      description: String(description || '').trim(),
      color,
      code,
      ownerId: OPENID,
      ownerName: userProfile.nickname,
      memberCount: 1,
      createdAt,
      updatedAt: createdAt
    }
  });

  await db.collection(COLLECTIONS.CIRCLE_MEMBERS).add({
    data: {
      circleId: circleRes._id,
      ...toMemberSnapshot(userProfile, 'owner'),
      status: 'active',
      createdAt,
      updatedAt: createdAt
    }
  });

  return {
    circle: {
      _id: circleRes._id,
      id: circleRes._id,
      name: String(name).trim(),
      description: String(description || '').trim(),
      color,
      code,
      ownerId: OPENID,
      ownerName: userProfile.nickname,
      memberCount: 1,
      createdAt,
      role: 'owner'
    }
  };
};
