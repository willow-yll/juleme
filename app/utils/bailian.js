function generateCircleInterpretation(circleId) {
  const app = getApp();
  return app.generateCircleInterpretation(circleId).then((result) => result && result.text ? result.text : '');
}

module.exports = {
  generateCircleInterpretation
};
