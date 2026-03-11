// 创建圈子页面
Page({
  data: {
    name: '',
    description: '',
    color: '#9B7DED',
    code: '',
    colors: ['#9B7DED', '#FFAB76', '#7DD3C0', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']
  },

  onLoad() {
    this.generateCode();
  },

  // 生成圈子号码
  generateCode() {
    const code = Math.random().toString().slice(2, 8);
    this.setData({ code });
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

  handleCreate() {
    const { name, description, color, code } = this.data;

    if (!name) {
      wx.showToast({ title: '请输入圈子名称', icon: 'none' });
      return;
    }

    const app = getApp();
    const newCircle = {
      id: Date.now(),
      name: name,
      description: description,
      color: color,
      code: code,
      ownerId: 'me',
      memberCount: 1,
      createdAt: new Date().toISOString().split('T')[0]
    };

    if (!app.globalData.circles) {
      app.globalData.circles = [];
    }
    app.globalData.circles.push(newCircle);
    app.globalData.currentCircleId = newCircle.id;
    app.globalData.currentCircle = newCircle;

    wx.showToast({ title: '创建成功！', icon: 'success' });

    setTimeout(() => {
      wx.switchTab({ url: '/pages/index/index' });
    }, 1500);
  }
});