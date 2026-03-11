// 年度报告
Page({
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