// 回忆博物馆
const app = getApp();

Page({
  data: {
    museum: []
  },

  onLoad() {
    this.loadMuseum();
  },

  onShow() {
    this.loadMuseum();
  },

  loadMuseum() {
    const museum = app.globalData.museum || [];
    this.setData({ museum });
  },

  onShareAppMessage() {
    return {
      title: '聚了吗 - 回忆博物馆',
      path: '/pages/wishlist/museum/index'
    };
  }
});