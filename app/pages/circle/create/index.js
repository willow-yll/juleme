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
    const app = getApp();
    const code = app.generateJoinCode();
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
    const newCircleId = Date.now();

    const newCircle = {
      id: newCircleId,
      name: name,
      description: description,
      color: color,
      code: code,
      ownerId: 'me',
      // 圈主自动加入成员列表
      members: [
        { id: 'me', avatar: 'https://picsum.photos/100', name: '我', role: 'owner' }
      ],
      memberCount: 1,
      // 初始化加入申请列表
      joinRequests: [],
      createdAt: new Date().toISOString()
    };

    if (!app.globalData.circles) {
      app.globalData.circles = [];
    }
    app.globalData.circles.push(newCircle);

    // 初始化该圈子的数据容器
    app.ensureCircleData(newCircleId);

    // 设置为当前圈子
    app.setCurrentCircle(newCircle);

    wx.showToast({ title: '创建成功！', icon: 'success' });

    setTimeout(() => {
      wx.switchTab({ url: '/pages/index/index' });
    }, 1500);
  }
});