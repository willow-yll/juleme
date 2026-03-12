// 圈子页面
const app = getApp();

Page({
  data: {
    circles: [],
    myPendingRequests: [],
    pendingRequests: [],
    showFabMenu: false,
    currentCircleId: null,
    loading: true
  },

  onLoad() {
    this.loadCircles();
  },

  onShow() {
    this.loadCircles();
  },

  async loadCircles() {
    this.setData({ loading: true });
    try {
      await app.ensureBootstrap();
      const result = await app.loadCircleList();
      const circles = Array.isArray(result && result.circles) ? result.circles : [];
      const myPendingRequests = Array.isArray(result && result.myPendingRequests)
        ? result.myPendingRequests.map((item) => ({
            id: item._id,
            circleId: item.circleId,
            circleName: item.circleName,
            circleCode: item.circleCode || '',
            status: item.status
          }))
        : [];
      const pendingRequests = Array.isArray(result && result.pendingRequests)
        ? result.pendingRequests.map((item) => ({
            id: item._id,
            circleId: item.circleId,
            userName: item.applicantName,
            userAvatar: item.applicantAvatar,
            circleName: item.circleName,
            status: item.status
          }))
        : [];

      const currentCircleId = app.getCurrentCircleId();
      const normalizedCircles = circles.map((item) => ({ ...item, id: item._id }));

      this.setData({
        circles: normalizedCircles,
        myPendingRequests,
        pendingRequests,
        currentCircleId,
        loading: false
      });

      const pages = getCurrentPages();
      const shouldAutoEnter = pages.length === 1 && !!currentCircleId && normalizedCircles.some((item) => item.id === currentCircleId);
      if (shouldAutoEnter) {
        wx.switchTab({ url: '/pages/circle/home/index' });
      }
    } catch (error) {
      this.setData({ loading: false });
      wx.showToast({ title: error.message || '加载圈子失败', icon: 'none' });
    }
  },

  toggleFabMenu() {
    this.setData({ showFabMenu: !this.data.showFabMenu });
  },

  goToCreateCircle() {
    this.setData({ showFabMenu: false });
    wx.navigateTo({ url: '/pages/circle/create/index' });
  },

  goToJoinCircle() {
    this.setData({ showFabMenu: false });
    wx.navigateTo({ url: '/pages/circle/join/index' });
  },

  async enterCircle(e) {
    const { id } = e.currentTarget.dataset;
    const circle = this.data.circles.find((item) => item.id === id);
    if (!circle) {
      wx.showToast({ title: '圈子不存在', icon: 'none' });
      return;
    }

    try {
      app.setCurrentCircle(circle.id);
      await app.loadCurrentCircleData();
      wx.switchTab({ url: '/pages/circle/home/index' });
    } catch (error) {
      wx.showToast({ title: error.message || '进入圈子失败', icon: 'none' });
    }
  },

  async acceptRequest(e) {
    const { id } = e.currentTarget.dataset;
    const request = this.data.pendingRequests.find((item) => item.id === id);
    if (!request) {
      wx.showToast({ title: '申请不存在', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认同意',
      content: `同意「${request.userName}」加入圈子？`,
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await app.reviewJoinRequest({ circleId: request.circleId, requestId: id, status: 'approved' });
          await this.loadCircles();
          wx.showToast({ title: '已同意加入', icon: 'success' });
        } catch (error) {
          wx.showToast({ title: error.message || '处理失败', icon: 'none' });
        }
      }
    });
  },

  async rejectRequest(e) {
    const { id } = e.currentTarget.dataset;
    const request = this.data.pendingRequests.find((item) => item.id === id);
    if (!request) {
      wx.showToast({ title: '申请不存在', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认拒绝',
      content: `拒绝「${request.userName}」加入圈子？`,
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await app.reviewJoinRequest({ circleId: request.circleId, requestId: id, status: 'rejected' });
          await this.loadCircles();
          wx.showToast({ title: '已拒绝', icon: 'none' });
        } catch (error) {
          wx.showToast({ title: error.message || '处理失败', icon: 'none' });
        }
      }
    });
  },

  onShareAppMessage() {
    return {
      title: '聚了吗 - 加入我的圈子',
      path: '/pages/circle/index'
    };
  }
});
