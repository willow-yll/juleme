// 年度报告
const app = getApp();

Page({
  onShow() {
    // 页面守卫：检查是否选择了圈子
    if (!app.globalData.currentCircleId) {
      wx.redirectTo({ url: '/pages/circle/index' });
      return;
    }
  },

  // 保存图片
  saveImage() {
    wx.showToast({
      title: '长按屏幕可截图分享',
      icon: 'none'
    });
  },

  onShareAppMessage() {
    return {
      title: '聚了吗 - 2026年度回顾',
      path: '/pages/capsule/index'
    };
  }
});