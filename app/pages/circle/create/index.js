// 创建圈子页面
const app = getApp();

Page({
  data: {
    name: '',
    description: '',
    color: '#9B7DED',
    code: '',
    colors: ['#9B7DED', '#FFAB76', '#7DD3C0', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']
  },

  onLoad() {
    // 检查是否已完善个人资料
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
    this.generateCode();
  },

  // 生成圈子号码
  generateCode() {
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

    const newCircleId = Date.now();
    const profile = app.getUserProfile() || {};

    const newCircle = {
      id: newCircleId,
      name: name,
      description: description,
      color: color,
      code: code,
      ownerId: 'me',
      // 圈主自动加入成员列表，带入个人资料
      members: [
        {
          id: 'me',
          avatar: profile.avatar || 'https://picsum.photos/100',
          name: profile.nickname || '我',
          role: 'owner',
          gender: profile.gender || '',
          mbti: profile.mbti || '',
          constellation: profile.constellation || ''
        }
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
      wx.switchTab({ url: '/pages/circle/home/index' });
    }, 1500);
  }
});