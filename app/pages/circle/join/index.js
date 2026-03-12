// 加入圈子页面
const app = getApp();

Page({
  data: {
    code: '',
    errorMsg: '',
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

  onCodeInput(e) {
    this.setData({ code: e.detail.value, errorMsg: '' });
  },

  async handleJoin() {
    const { code, submitting } = this.data;
    if (submitting) return;

    if (!app.hasUserProfile()) {
      wx.showModal({
        title: '提示',
        content: '请先完善个人资料',
        showCancel: false,
        success: () => {
          wx.redirectTo({ url: '/pages/profile/setup/index' });
        }
      });
      return;
    }

    if (!code || code.length !== 6) {
      this.setData({ errorMsg: '请输入6位圈子号码' });
      wx.showToast({ title: '请输入6位圈子号码', icon: 'none' });
      return;
    }

    this.setData({ submitting: true, errorMsg: '' });
    try {
      const result = await app.submitJoinRequest({ code });
      wx.showModal({
        title: '申请已提交',
        content: `已向圈主发送加入「${result.circleName}」的申请，请耐心等待确认`,
        showCancel: false,
        success: () => {
          wx.navigateBack();
        }
      });
    } catch (error) {
      this.setData({ submitting: false, errorMsg: error.message || '提交失败' });
      wx.showToast({ title: error.message || '提交失败', icon: 'none' });
    }
  }
});
