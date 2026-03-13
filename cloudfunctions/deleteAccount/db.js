const cloud = require('wx-server-sdk');
const { COLLECTIONS, DEFAULT_AVATAR, ANONYMIZED_NAME } = require('./constants');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

function nowIso() {
  return new Date().toISOString();
}

function getContext() {
  return cloud.getWXContext();
}

function requireOpenId(openid) {
  if (typeof openid !== 'string' || !openid.trim()) {
    throw new Error('未获取到用户身份，请从小程序端调用云函数。');
  }
  return openid;
}

function normalizeUserProfile(doc = {}, openid = '') {
  return {
    openid: doc.openid || openid,
    nickname: doc.nickname || '',
    gender: doc.gender || '',
    mbti: doc.mbti || '',
    constellation: doc.constellation || '',
    avatar: doc.avatar || DEFAULT_AVATAR,
    createdAt: doc.createdAt || nowIso(),
    updatedAt: doc.updatedAt || nowIso()
  };
}

async function ensureUser(openid) {
  const safeOpenId = requireOpenId(openid);
  const userCollection = db.collection(COLLECTIONS.USERS);
  const existing = await userCollection.doc(safeOpenId).get().catch(() => null);
  if (existing && existing.data) {
    return normalizeUserProfile(existing.data, safeOpenId);
  }

  const userProfile = normalizeUserProfile({ openid: safeOpenId }, safeOpenId);
  await userCollection.doc(safeOpenId).set({ data: userProfile });
  return userProfile;
}

module.exports = {
  cloud,
  db,
  nowIso,
  getContext,
  ensureUser,
  COLLECTIONS,
  DEFAULT_AVATAR,
  ANONYMIZED_NAME
};
