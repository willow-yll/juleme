const { buildCircleContent, ensureUser, getContext } = require('../common/db');

exports.main = async (event) => {
  const { circleId } = event;
  if (!circleId) {
    throw new Error('缺少圈子ID');
  }

  const { OPENID } = getContext();
  await ensureUser(OPENID);
  return buildCircleContent(circleId, OPENID);
};
