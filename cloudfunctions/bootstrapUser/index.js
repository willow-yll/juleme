const { ensureUser, getContext, listMyCircles } = require('../common/db');

exports.main = async () => {
  const { OPENID } = getContext();
  const userProfile = await ensureUser(OPENID);
  const circles = await listMyCircles(OPENID);

  return {
    openid: OPENID,
    userProfile,
    circles
  };
};
