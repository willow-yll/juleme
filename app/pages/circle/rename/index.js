const app = getApp();

Page({
  data: {
    name: ''
  },

  async onLoad() {
    try {
      await app.ensureBootstrap();
      const circleId = await app.ensureCurrentCircleSelected();
      if (!circleId) {
        wx.showToast({ title: '请先选择圈子', icon: 'none' });
        setTimeout(() => {
          wx.navigateBack();
        }, 1200);
        return;
      }

      const circleData = app.getCurrentCircleData() || await app.loadCurrentCircleData();
      const circle = circleData ? circleData.circle : null;
      if (!circle) {
        wx.showToast({ title: '圈子不存在', icon: 'none' });
        setTimeout(() => {
          wx.navigateBack();
        }, 1200);
        return;
      }

      if (circle.ownerId !== app.getCurrentUserId()) {
        wx.showToast({ title: '只有圈主可以改名', icon: 'none' });
        setTimeout(() => {
          wx.navigateBack();
        }, 1200);
        return;
      }

      this.setData({ name: circle.name || '' });
    } catch (error) {
      wx.showToast({ title: error.message || '加载失败', icon: 'none' });
    }
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value });
  },

  async handleRename() {
    const name = (this.data.name || '').trim();
    if (!name) {
      wx.showToast({ title: '请输入圈子名称', icon: 'none' });
      return;
    }

    try {
      await app.renameCurrentCircle(name);
      wx.showToast({ title: '修改成功！', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1200);
    } catch (error) {
      wx.showToast({ title: error.message || '修改失败', icon: 'none' });
    }
  }
});
