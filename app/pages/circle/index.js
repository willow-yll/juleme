// 圈子页面
const app = getApp();

Page({
  data: {
    circles: [],
    pendingRequests: [],
    showFabMenu: false,
    currentCircleId: null
  },

  onLoad() {
    this.loadCircles();
  },

  onShow() {
    this.loadCircles();
  },

  // 加载圈子数据
  loadCircles() {
    const circles = app.globalData.circles || [];
    const pendingRequests = app.globalData.pendingRequests || [];
    const currentCircleId = app.globalData.currentCircleId;

    this.setData({
      circles: circles.map(c => ({
        ...c,
        role: c.ownerId === 'me' ? 'owner' : 'member'
      })),
      pendingRequests: pendingRequests,
      currentCircleId
    });

    console.log('加载圈子:', circles.length, '个');
  },

  // 切换 FAB 菜单
  toggleFabMenu() {
    this.setData({ showFabMenu: !this.data.showFabMenu });
  },

  // 跳转到创建圈子
  goToCreateCircle() {
    this.setData({ showFabMenu: false });
    wx.navigateTo({ url: '/pages/circle/create' });
  },

  // 跳转到加入圈子
  goToJoinCircle() {
    this.setData({ showFabMenu: false });
    wx.navigateTo({ url: '/pages/circle/join' });
  },

  // 进入圈子
  enterCircle(e) {
    const { id } = e.currentTarget.dataset;
    const circle = this.data.circles.find(c => c.id === id);

    if (circle) {
      app.globalData.currentCircleId = id;
      app.globalData.currentCircle = circle;

      wx.showToast({ title: `进入${circle.name}`, icon: 'success' });

      // 跳转到动态页（之前的首页）
      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' });
      }, 1000);
    }
  },

  // 同意加入申请
  acceptRequest(e) {
    const { id } = e.currentTarget.dataset;

    wx.showModal({
      title: '确认同意',
      content: '同意该用户加入圈子？',
      success: (res) => {
        if (res.confirm) {
          const requests = this.data.pendingRequests.filter(r => r.id !== id);
          app.globalData.pendingRequests = requests;
          this.setData({ pendingRequests: requests });
          wx.showToast({ title: '已同意', icon: 'success' });
        }
      }
    });
  },

  // 拒绝加入申请
  rejectRequest(e) {
    const { id } = e.currentTarget.dataset;

    const requests = this.data.pendingRequests.filter(r => r.id !== id);
    app.globalData.pendingRequests = requests;
    this.setData({ pendingRequests: requests });
    wx.showToast({ title: '已拒绝', icon: 'none' });
  },

  onShareAppMessage() {
    return {
      title: '聚了吗 - 加入我的圈子',
      path: '/pages/circle/index'
    };
  }
});