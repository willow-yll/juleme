// 个人中心
const app = getApp();

Page({
  data: {
    stats: {
      wishes: 0,
      moments: 0,
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

    // 当前圈子的活动数
    const wishes = circleData ? circleData.wishes.length : 0;

    // 当前圈子加入的圈子数
    const circles = app.globalData.circles.filter(c => {
      const members = c.members || [];
      return members.some(m => m.id === 'me');
    }).length;

    // 当前圈子的瞬间数（萌宠+萌娃）
    let moments = 0;
    if (circleData) {
      if (circleData.pets) {
        circleData.pets.forEach(p => {
          if (p.moments) moments += p.moments.length;
        });
      }
      if (circleData.babies) {
        circleData.babies.forEach(b => {
          if (b.moments) moments += b.moments.length;
        });
      }
    }

    // 当前圈子的成员数
    const friends = currentCircle ? currentCircle.memberCount : 0;

    this.setData({
      currentCircle,
      stats: {
        wishes,
        moments,
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