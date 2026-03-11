// 个人中心
const app = getApp();

Page({
  data: {
    stats: {
      wishes: 0,
      moments: 0,
      circles: 0,
      friends: 12
    }
  },

  onShow() {
    if (!app.globalData.currentCircleId) {
      wx.redirectTo({ url: '/pages/circle/index' });
      return;
    }
    this.loadStats();
  },

  // 加载统计数据
  loadStats() {
    const wishes = app.globalData.wishes ? app.globalData.wishes.length : 0;
    const circles = app.globalData.circles ? app.globalData.circles.length : 0;

    let moments = 0;
    if (app.globalData.pets) {
      app.globalData.pets.forEach(p => {
        if (p.moments) moments += p.moments.length;
      });
    }
    if (app.globalData.babies) {
      app.globalData.babies.forEach(b => {
        if (b.moments) moments += b.moments.length;
      });
    }

    this.setData({
      stats: {
        wishes,
        moments,
        circles,
        friends: 12
      }
    });
  },

  // 跳转年度报告
  goToCapsule() {
    wx.navigateTo({
      url: '/pages/capsule/index'
    });
  },

  // 跳转萌宠墙
  goToMoments() {
    wx.navigateTo({
      url: '/pages/moment/index'
    });
  },

  // 跳转纪念日
  goToAnniversary() {
    wx.switchTab({
      url: '/pages/anniversary/index'
    });
  },

  // 跳转圈子
  goToCircles() {
    wx.navigateTo({
      url: '/pages/circle/index'
    });
  },

  onShareAppMessage() {
    return {
      title: '聚了吗 - 我的',
      path: '/pages/profile/index'
    };
  }
});