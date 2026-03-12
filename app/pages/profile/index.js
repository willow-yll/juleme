// 个人中心
const app = getApp();

Page({
  data: {
    stats: {
      wishes: 0,
      anniversaries: 0,
      circles: 0,
      friends: 0
    },
    currentCircle: null
  },

  onShow() {
    // 页面守卫：检查是否选择了圈子
    if (!app.globalData.currentCircleId) {
      wx.redirectTo({ url: '/pages/circle/index' });
      return;
    }

    this.loadStats();
  },

  // 加载统计数据 - 基于当前圈子
  loadStats() {
    const circleData = app.getCurrentCircleData();
    const currentCircle = app.globalData.currentCircle;

    const wishes = circleData ? circleData.wishes.length : 0;
    const anniversaries = circleData ? (circleData.anniversaries || []).length : 0;

    const circles = app.globalData.circles.filter(c => {
      const members = c.members || [];
      return members.some(m => m.id === 'me');
    }).length;

    const friends = currentCircle ? currentCircle.memberCount : 0;

    this.setData({
      currentCircle,
      stats: {
        wishes,
        anniversaries,
        circles,
        friends
      }
    });
  },

  // 跳转年度报告
  goToCapsule() {
    wx.navigateTo({
      url: '/pages/capsule/index'
    });
  },

  // 跳转资料设置
  goToProfileSetup() {
    wx.navigateTo({
      url: '/pages/profile/setup/index'
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