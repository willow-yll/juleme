const cloud = require('wx-server-sdk');
const { COLLECTIONS, DEFAULT_AVATAR } = require('./constants');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

function now() {
  return new Date();
}

function nowIso() {
  return new Date().toISOString();
}

function getContext() {
  return cloud.getWXContext();
}

function requireOpenId(openid) {
  if (typeof openid !== 'string' || !openid.trim()) {
    throw new Error('未获取到用户身份，请从小程序端调用云函数，不要直接在云函数测试面板里运行需要 openid 的函数。');
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

function toMemberSnapshot(userProfile = {}, role = 'member') {
  return {
    userId: userProfile.openid,
    name: userProfile.nickname || '未命名用户',
    avatar: userProfile.avatar || DEFAULT_AVATAR,
    gender: userProfile.gender || '',
    mbti: userProfile.mbti || '',
    constellation: userProfile.constellation || '',
    role
  };
}

async function ensureUser(openid) {
  const safeOpenId = requireOpenId(openid);
  const userCollection = db.collection(COLLECTIONS.USERS);
  const existing = await userCollection.doc(safeOpenId).get().catch(() => null);
  if (existing && existing.data) {
    return normalizeUserProfile(existing.data, safeOpenId);
  }

  const userProfile = normalizeUserProfile({
    openid: safeOpenId
  }, safeOpenId);

  await userCollection.doc(safeOpenId).set({ data: userProfile });
  return userProfile;
}

async function getUser(openid) {
  const safeOpenId = requireOpenId(openid);
  const result = await db.collection(COLLECTIONS.USERS).doc(safeOpenId).get().catch(() => null);
  return result && result.data ? normalizeUserProfile(result.data, safeOpenId) : null;
}

async function requireUser(openid) {
  const user = await getUser(openid);
  if (!user) {
    throw new Error('用户不存在，请重新进入小程序重试');
  }
  return user;
}

async function listMyCircles(openid) {
  const memberRes = await db.collection(COLLECTIONS.CIRCLE_MEMBERS).where({ userId: openid, status: 'active' }).get();
  const memberships = memberRes.data || [];
  if (!memberships.length) {
    return [];
  }

  const circles = await Promise.all(memberships.map(async (membership) => {
    const circleRes = await db.collection(COLLECTIONS.CIRCLES).doc(membership.circleId).get().catch(() => null);
    if (!circleRes || !circleRes.data) {
      return null;
    }

    const circle = circleRes.data;
    return {
      _id: circle._id,
      name: circle.name,
      description: circle.description || '',
      color: circle.color || '#9B7DED',
      code: circle.code,
      ownerId: circle.ownerId,
      ownerName: circle.ownerName || '',
      memberCount: circle.memberCount || 0,
      createdAt: circle.createdAt,
      role: membership.role || 'member'
    };
  }));

  return circles.filter(Boolean);
}

async function getCircle(circleId) {
  const result = await db.collection(COLLECTIONS.CIRCLES).doc(circleId).get().catch(() => null);
  return result && result.data ? result.data : null;
}

async function requireCircle(circleId) {
  const circle = await getCircle(circleId);
  if (!circle) {
    throw new Error('圈子不存在');
  }
  return circle;
}

async function getMembership(circleId, openid) {
  const result = await db.collection(COLLECTIONS.CIRCLE_MEMBERS).where({ circleId, userId: openid, status: 'active' }).get();
  return result.data && result.data[0] ? result.data[0] : null;
}

async function requireMembership(circleId, openid) {
  const membership = await getMembership(circleId, openid);
  if (!membership) {
    throw new Error('你还不是该圈子成员');
  }
  return membership;
}

async function requireCircleOwner(circleId, openid) {
  const membership = await requireMembership(circleId, openid);
  if (membership.role !== 'owner') {
    throw new Error('只有圈主可以执行该操作');
  }
  return membership;
}

async function getPendingJoinRequest(circleId, openid) {
  const result = await db.collection(COLLECTIONS.CIRCLE_JOIN_REQUESTS).where({
    circleId,
    applicantId: openid,
    status: 'pending'
  }).get();
  return result.data && result.data[0] ? result.data[0] : null;
}

async function buildCircleListData(openid) {
  const circles = await listMyCircles(openid);
  const myPendingRes = await db.collection(COLLECTIONS.CIRCLE_JOIN_REQUESTS).where({ applicantId: openid, status: 'pending' }).get();
  const myPendingRequests = myPendingRes.data || [];

  const ownerCircleIds = circles.filter((circle) => circle.role === 'owner').map((circle) => circle._id);
  let pendingRequests = [];

  if (ownerCircleIds.length) {
    const ownerPending = await Promise.all(ownerCircleIds.map(async (circleId) => {
      const requestRes = await db.collection(COLLECTIONS.CIRCLE_JOIN_REQUESTS).where({ circleId, status: 'pending' }).get();
      return requestRes.data || [];
    }));
    pendingRequests = ownerPending.flat();
  }

  return {
    circles,
    myPendingRequests,
    pendingRequests
  };
}

async function buildCircleContent(circleId, openid) {
  await requireMembership(circleId, openid);
  const circle = await requireCircle(circleId);

  const [membersRes, wishesRes, claimsRes, anniversariesRes, feedRes] = await Promise.all([
    db.collection(COLLECTIONS.CIRCLE_MEMBERS).where({ circleId, status: 'active' }).get(),
    db.collection(COLLECTIONS.WISHES).where({ circleId, status: _.neq('deleted') }).get(),
    db.collection(COLLECTIONS.WISH_CLAIMS).where({ circleId, status: 'active' }).get(),
    db.collection(COLLECTIONS.ANNIVERSARIES).where({ circleId, status: 'active' }).get(),
    db.collection(COLLECTIONS.FEED_EVENTS).where({ circleId }).orderBy('createdAt', 'desc').limit(50).get()
  ]);

  const members = (membersRes.data || []).map((item) => ({
    id: item.userId,
    avatar: item.avatar || DEFAULT_AVATAR,
    name: item.name || '未命名用户',
    role: item.role || 'member',
    gender: item.gender || '',
    mbti: item.mbti || '',
    constellation: item.constellation || ''
  }));

  const claimsByWishId = (claimsRes.data || []).reduce((acc, item) => {
    if (!acc[item.wishId]) {
      acc[item.wishId] = [];
    }
    acc[item.wishId].push({
      user: {
        id: item.userId,
        avatar: item.userAvatar || DEFAULT_AVATAR,
        name: item.userName || '未命名用户'
      },
      wantGo: true,
      claimedAt: item.createdAt
    });
    return acc;
  }, {});

  const wishes = (wishesRes.data || [])
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((wish) => ({
      id: wish._id,
      title: wish.title,
      description: wish.description || '',
      category: wish.category,
      categoryText: wish.categoryText,
      creator: {
        id: wish.creatorId,
        avatar: wish.creatorAvatar || DEFAULT_AVATAR,
        name: wish.creatorName || '未命名用户'
      },
      targetDate: wish.targetDate || '',
      createdAt: wish.createdAt,
      status: wish.status || 'active',
      claimed: claimsByWishId[wish._id] || [],
      maxClaim: wish.maxClaim || 0,
      likes: wish.likes || 0
    }));

  const anniversaries = (anniversariesRes.data || [])
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((item) => ({
      id: item._id,
      name: item.name,
      type: item.type,
      date: item.date || '',
      cycleType: item.cycleType || '',
      cycleValue: item.cycleValue,
      nextDate: item.nextDate || '',
      enabled: item.enabled !== false,
      icon: item.icon || '🎉',
      createdAt: item.createdAt,
      creatorId: item.creatorId
    }));

  const feedItems = (feedRes.data || []).map((item) => ({
    id: item._id,
    user: {
      avatar: item.userAvatar || DEFAULT_AVATAR,
      name: item.userName || '未命名用户'
    },
    type: item.type,
    content: item.content,
    title: item.title,
    time: item.displayTime || '刚刚',
    likes: item.likes || 0,
    comments: item.comments || [],
    createdAt: item.createdAt
  }));

  return {
    circle: {
      _id: circle._id,
      id: circle._id,
      name: circle.name,
      description: circle.description || '',
      color: circle.color || '#9B7DED',
      code: circle.code,
      ownerId: circle.ownerId,
      ownerName: circle.ownerName || '',
      memberCount: circle.memberCount || members.length,
      createdAt: circle.createdAt
    },
    members,
    wishes,
    anniversaries,
    feedItems,
    pets: [],
    babies: []
  };
}

async function addFeedEvent({ circleId, type, content, title, userProfile }) {
  return db.collection(COLLECTIONS.FEED_EVENTS).add({
    data: {
      circleId,
      type,
      content,
      title,
      userId: userProfile.openid,
      userName: userProfile.nickname || '未命名用户',
      userAvatar: userProfile.avatar || DEFAULT_AVATAR,
      likes: 0,
      comments: [],
      displayTime: '刚刚',
      createdAt: nowIso(),
      updatedAt: nowIso()
    }
  });
}

function getCategoryText(category) {
  const categoryMap = {
    restaurant: '餐厅',
    travel: '旅行',
    sport: '运动',
    entertainment: '娱乐',
    other: '其他'
  };
  return categoryMap[category] || '其他';
}

async function generateUniqueCircleCode() {
  for (let index = 0; index < 10; index += 1) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const exists = await db.collection(COLLECTIONS.CIRCLES).where({ code }).get();
    if (!(exists.data || []).length) {
      return code;
    }
  }
  throw new Error('圈子号码生成失败，请稍后重试');
}

module.exports = {
  cloud,
  db,
  _,
  now,
  nowIso,
  getContext,
  requireOpenId,
  normalizeUserProfile,
  toMemberSnapshot,
  ensureUser,
  getUser,
  requireUser,
  listMyCircles,
  getCircle,
  requireCircle,
  getMembership,
  requireMembership,
  requireCircleOwner,
  getPendingJoinRequest,
  buildCircleListData,
  buildCircleContent,
  addFeedEvent,
  getCategoryText,
  generateUniqueCircleCode,
  COLLECTIONS,
  DEFAULT_AVATAR
};
