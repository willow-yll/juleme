// 创建圈子页面
const app = getApp();

Page({
  data: {
    name: '',
    description: '',
    color: '#9B7DED',
    colors: ['#9B7DED', '#FFAB76', '#7DD3C0', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
    submitting: false
  },

  async onLoad() {
    try {
      await app.ensureBootstrap();
      if (!app.hasUserProfile()) {
        wx.showModal({
          title: '提示',
          content: '请先完善个人资料',
          showCancel: false,
          success: () => {
            wx.redirectTo({ url: '/pages/profile/setup/index' });
          }
        });
      }
    } catch (error) {
      wx.showToast({ title: error.message || '初始化失败', icon: 'none' });
    }
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value });
  },

  onDescInput(e) {
    this.setData({ description: e.detail.value });
  },

  selectColor(e) {
    const { color } = e.currentTarget.dataset;
    this.setData({ color });
  },

  async handleCreate() {
    const { name, description, color, submitting } = this.data;
    if (submitting) return;

    if (!name || !name.trim()) {
      wx.showToast({ title: '请输入圈子名称', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    try {
      await app.createCircle({
        name: name.trim(),
        description: (description || '').trim(),
        color
      });
      wx.showToast({ title: '创建成功！', icon: 'success' });
      setTimeout(() => {
        wx.switchTab({ url: '/pages/circle/home/index' });
      }, 800);
    } catch (error) {
      this.setData({ submitting: false });
      wx.showToast({ title: error.message || '创建失败', icon: 'none' });
    }
  }
});
