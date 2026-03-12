// 加入圈子页面
const app = getApp();

Page({
  data: {
    code: '',
    errorMsg: ''
  },

  onCodeInput(e) {
    this.setData({ code: e.detail.value, errorMsg: '' });
  },

  handleJoin() {
    const { code } = this.data;

    if (!code || code.length !== 6) {
      this.setData({ errorMsg: '请输入6位圈子号码' });
      wx.showToast({ title: '请输入6位圈子号码', icon: 'none' });
      return;
    }

    const circles = app.globalData.circles || [];

    // 查找圈子
    const circle = circles.find(c => c.code === code);

    if (!circle) {
      this.setData({ errorMsg: '圈子不存在' });
      wx.showToast({ title: '圈子不存在', icon: 'none' });
      return;
    }

    // 检查是否已经是成员
    if (app.isCircleMember(circle.id)) {
      this.setData({ errorMsg: '你已加入该圈子' });
      wx.showToast({ title: '你已加入该圈子', icon: 'none' });
      return;
    }

    // 检查是否已经有待处理的申请
    if (app.hasPendingRequest(circle.id)) {
      this.setData({ errorMsg: '已有待处理的申请' });
      wx.showToast({ title: '已有待处理的��请，请耐心等待', icon: 'none' });
      return;
    }

    // 检查是否是自己创建的圈子
    if (circle.ownerId === 'me') {
      this.setData({ errorMsg: '这是你自己的圈子' });
      wx.showToast({ title: '这是你自己的圈子', icon: 'none' });
      return;
    }

    // 创建加入申请
    const joinRequest = {
      id: Date.now(),
      circleId: circle.id,
      circleName: circle.name,
      userId: 'me',
      userName: '我',
      userAvatar: 'https://picsum.photos/100',
      status: 'pending',
      requestedAt: new Date().toISOString()
    };

    // 将申请添加到圈子的 joinRequests 中
    if (!circle.joinRequests) {
      circle.joinRequests = [];
    }
    circle.joinRequests.push(joinRequest);

    // 更新 globalData
    app.globalData.circles = circles;

    wx.showModal({
      title: '申请已提交',
      content: `已向圈主发送加入「${circle.name}」的申请，请耐心等待确认`,
      showCancel: false,
      success: () => {
        wx.navigateBack();
      }
    });
  }
});