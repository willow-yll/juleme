const { buildCircleListData, ensureUser, getContext } = require('./db');

exports.main = async () => {
  const { OPENID } = getContext();
  await ensureUser(OPENID);
  return buildCircleListData(OPENID);
};
