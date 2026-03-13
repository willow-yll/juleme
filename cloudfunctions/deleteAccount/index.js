const { db, nowIso, getContext, ensureUser, COLLECTIONS, DEFAULT_AVATAR, ANONYMIZED_NAME } = require('./db');

exports.main = async () => {
  const { OPENID } = getContext();
  await ensureUser(OPENID);
  const updatedAt = nowIso();

  const ownerMemberships = await db.collection(COLLECTIONS.CIRCLE_MEMBERS).where({
    userId: OPENID,
    status: 'active',
    role: 'owner'
  }).get();
  if ((ownerMemberships.data || []).length) {
    throw new Error('你仍是圈主，请先处理自己的圈子后再注销');
  }

  const activeMemberships = await db.collection(COLLECTIONS.CIRCLE_MEMBERS).where({
    userId: OPENID,
    status: 'active'
  }).get();
  const activeClaims = await db.collection(COLLECTIONS.WISH_CLAIMS).where({
    userId: OPENID,
    status: 'active'
  }).get();
  const pendingRequests = await db.collection(COLLECTIONS.CIRCLE_JOIN_REQUESTS).where({
    applicantId: OPENID,
    status: 'pending'
  }).get();
  const wishes = await db.collection(COLLECTIONS.WISHES).where({ creatorId: OPENID }).get();
  const anniversaries = await db.collection(COLLECTIONS.ANNIVERSARIES).where({ creatorId: OPENID }).get();
  const feedEvents = await db.collection(COLLECTIONS.FEED_EVENTS).where({ userId: OPENID }).get();

  const affectedCircleIds = [...new Set((activeMemberships.data || []).map((item) => item.circleId))];
  const circles = await Promise.all(affectedCircleIds.map((circleId) => db.collection(COLLECTIONS.CIRCLES).doc(circleId).get().catch(() => null)));

  await Promise.all((activeMemberships.data || []).map((item) => db.collection(COLLECTIONS.CIRCLE_MEMBERS).doc(item._id).update({
    data: {
      status: 'deleted',
      updatedAt,
      deletedAt: updatedAt,
      name: ANONYMIZED_NAME,
      avatar: DEFAULT_AVATAR,
      gender: '',
      mbti: '',
      constellation: ''
    }
  })));

  await Promise.all((activeClaims.data || []).map((item) => db.collection(COLLECTIONS.WISH_CLAIMS).doc(item._id).update({
    data: {
      status: 'cancelled',
      updatedAt,
      cancelledBy: OPENID,
      cancelReason: 'account_deleted',
      userName: ANONYMIZED_NAME,
      userAvatar: DEFAULT_AVATAR
    }
  })));

  await Promise.all((pendingRequests.data || []).map((item) => db.collection(COLLECTIONS.CIRCLE_JOIN_REQUESTS).doc(item._id).update({
    data: {
      status: 'cancelled',
      updatedAt,
      applicantName: ANONYMIZED_NAME,
      applicantAvatar: DEFAULT_AVATAR
    }
  })));

  await Promise.all((wishes.data || []).map((item) => db.collection(COLLECTIONS.WISHES).doc(item._id).update({
    data: {
      creatorName: ANONYMIZED_NAME,
      creatorAvatar: DEFAULT_AVATAR,
      updatedAt
    }
  })));

  await Promise.all((anniversaries.data || []).map((item) => db.collection(COLLECTIONS.ANNIVERSARIES).doc(item._id).update({
    data: {
      creatorName: ANONYMIZED_NAME,
      updatedAt
    }
  })));

  await Promise.all((feedEvents.data || []).map((item) => db.collection(COLLECTIONS.FEED_EVENTS).doc(item._id).update({
    data: {
      userName: ANONYMIZED_NAME,
      userAvatar: DEFAULT_AVATAR,
      updatedAt
    }
  })));

  await Promise.all(circles.filter((item) => item && item.data).map((res) => {
    const circle = res.data;
    const remainingMembers = Math.max((circle.memberCount || 0) - 1, 0);
    return db.collection(COLLECTIONS.CIRCLES).doc(circle._id).update({
      data: {
        memberCount: remainingMembers,
        updatedAt
      }
    });
  }));

  const existingUser = await db.collection(COLLECTIONS.USERS).doc(OPENID).get().catch(() => null);
  const createdAt = existingUser && existingUser.data && existingUser.data.createdAt
    ? existingUser.data.createdAt
    : updatedAt;

  await db.collection(COLLECTIONS.USERS).doc(OPENID).set({
    data: {
      openid: OPENID,
      nickname: ANONYMIZED_NAME,
      gender: '',
      mbti: '',
      constellation: '',
      avatar: DEFAULT_AVATAR,
      status: 'deleted',
      deletedAt: updatedAt,
      createdAt,
      updatedAt
    }
  });

  return {
    deleted: true,
    affectedCircles: affectedCircleIds.length
  };
};
