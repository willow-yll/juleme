const { db, nowIso, getContext, ensureUser, COLLECTIONS } = require('../common/db');

exports.main = async (event) => {
  const { nickname, gender = '', mbti = '', constellation = '', avatar = '' } = event;
  const trimmedNickname = String(nickname || '').trim();
  if (!trimmedNickname) {
    throw new Error('请输入昵称');
  }

  const { OPENID } = getContext();
  const existing = await ensureUser(OPENID);
  const updatedAt = nowIso();
  const userProfile = {
    _id: OPENID,
    openid: OPENID,
    nickname: trimmedNickname,
    gender,
    mbti,
    constellation,
    avatar: avatar || existing.avatar,
    createdAt: existing.createdAt,
    updatedAt
  };

  await db.collection(COLLECTIONS.USERS).doc(OPENID).set({ data: userProfile });

  const memberRes = await db.collection(COLLECTIONS.CIRCLE_MEMBERS).where({ userId: OPENID, status: 'active' }).get();
  await Promise.all((memberRes.data || []).map((item) => db.collection(COLLECTIONS.CIRCLE_MEMBERS).doc(item._id).update({
    data: {
      name: trimmedNickname,
      avatar: userProfile.avatar,
      gender,
      mbti,
      constellation,
      updatedAt
    }
  })));

  return { userProfile };
};
