const { buildCircleListData, ensureUser, getContext } = require('../common/db');

exports.main = async () => {
  const { OPENID } = getContext();
  await ensureUser(OPENID);
  return buildCircleListData(OPENID);
};
