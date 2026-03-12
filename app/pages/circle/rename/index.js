const app = getApp();

Page({
  data: {
    name: ''
  },

  onLoad() {
    const circle = app.globalData.currentCircle;
    if (!circle) {
      wx.showToast({ title: '请先选择圈子', icon: 'none' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1200);
      return;
    }

    if (circle.ownerId !== 'me') {
      wx.showToast({ title: '只有圈主可以改名', icon: 'none' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1200);
      return;
    }

    this.setData({ name: circle.name || '' });
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value });
  },

  handleRename() {
    const name = (this.data.name || '').trim();

    if (!name) {
      wx.showToast({ title: '请输入圈子名称', icon: 'none' });
      return;
    }

    const updatedCircle = app.renameCurrentCircle(name);
    if (!updatedCircle) {
      wx.showToast({ title: '圈子不存在', icon: 'none' });
      return;
    }

    wx.showToast({ title: '修改成功！', icon: 'success' });
    setTimeout(() => {
      wx.navigateBack();
    }, 1200);
  }
});