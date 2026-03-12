const { db, nowIso, getContext, ensureUser, requireMembership, COLLECTIONS } = require('../common/db');

exports.main = async (event) => {
  const { circleId, anniversaryId, enabled } = event;
  if (!circleId || !anniversaryId) {
    throw new Error('缺少纪念日参数');
  }

  const { OPENID } = getContext();
  await ensureUser(OPENID);
  await requireMembership(circleId, OPENID);

  const anniversaryRes = await db.collection(COLLECTIONS.ANNIVERSARIES).doc(anniversaryId).get().catch(() => null);
  const anniversary = anniversaryRes && anniversaryRes.data ? anniversaryRes.data : null;
  if (!anniversary || anniversary.circleId !== circleId || anniversary.status !== 'active') {
    throw new Error('纪念日不存在');
  }

  await db.collection(COLLECTIONS.ANNIVERSARIES).doc(anniversaryId).update({
    data: {
      enabled: !!enabled,
      updatedAt: nowIso()
    }
  });

  return { anniversaryId, enabled: !!enabled };
};
