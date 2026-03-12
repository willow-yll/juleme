// 圈子页面
const app = getApp();

Page({
  data: {
    circles: [],
    myPendingRequests: [],  // 我发出的申请
    pendingRequests: [],    // 待我审批的申请（只有圈主能看到）
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
    const currentCircleId = app.globalData.currentCircleId;

    // 获取我加入的圈子
    const myCircles = circles.filter(c => {
      const members = c.members || [];
      return members.some(m => m.id === 'me');
    });

    // 获取我发出的待处理申请
    const myPendingRequests = [];
    circles.forEach(c => {
      const requests = c.joinRequests || [];
      const pending = requests.filter(r => r.userId === 'me' && r.status === 'pending');
      pending.forEach(req => {
        myPendingRequests.push({
          ...req,
          circleName: c.name,
          circleCode: c.code
        });
      });
    });

    // 获取待我审批的申请（只有我是圈主的圈子）
    const ownerPendingRequests = [];
    circles.forEach(c => {
      if (c.ownerId === 'me') {
        const requests = c.joinRequests || [];
        const pending = requests.filter(r => r.status === 'pending');
        pending.forEach(req => {
          ownerPendingRequests.push({
            ...req,
            circleName: c.name,
            circleId: c.id
          });
        });
      }
    });

    this.setData({
      circles: myCircles.map(c => ({
        ...c,
        role: c.ownerId === 'me' ? 'owner' : 'member'
      })),
      myPendingRequests,
      pendingRequests: ownerPendingRequests,
      currentCircleId
    });

    console.log('加载圈子:', myCircles.length, '个');
    console.log('待我审批:', ownerPendingRequests.length, '个');
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
      app.setCurrentCircle(circle);

      wx.showToast({ title: `进入${circle.name}`, icon: 'success' });

      // 跳转到动态页
      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' });
      }, 1000);
    }
  },

  // 同意加入申请
  acceptRequest(e) {
    const { id } = e.currentTarget.dataset;
    const request = this.data.pendingRequests.find(r => r.id === id);

    if (!request) {
      wx.showToast({ title: '申请不存在', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认同意',
      content: `同意「${request.userName}」加入圈子？`,
      success: (res) => {
        if (res.confirm) {
          const circles = app.globalData.circles || [];
          const circle = circles.find(c => c.id === request.circleId);

          if (circle) {
            // 将申请人加入成员列表
            if (!circle.members) {
              circle.members = [];
            }

            // 检查是否已经是成员
            const alreadyMember = circle.members.some(m => m.id === request.userId);
            if (!alreadyMember) {
              circle.members.push({
                id: request.userId,
                avatar: request.userAvatar || 'https://picsum.photos/100',
                name: request.userName,
                role: 'member'
              });
              circle.memberCount = circle.members.length;
            }

            // 更新申请状态为已批准
            if (circle.joinRequests) {
              const req = circle.joinRequests.find(r => r.id === id);
              if (req) {
                req.status = 'approved';
              }
            }

            // 更新 globalData
            app.globalData.circles = circles;

            // 刷新页面
            this.loadCircles();

            wx.showToast({ title: '已同意加入', icon: 'success' });
          }
        }
      }
    });
  },

  // 拒绝加入申请
  rejectRequest(e) {
    const { id } = e.currentTarget.dataset;
    const request = this.data.pendingRequests.find(r => r.id === id);

    if (!request) {
      wx.showToast({ title: '申请不存在', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认拒绝',
      content: `拒绝「${request.userName}」加入圈子？`,
      success: (res) => {
        if (res.confirm) {
          const circles = app.globalData.circles || [];
          const circle = circles.find(c => c.id === request.circleId);

          if (circle && circle.joinRequests) {
            // 更新申请状态为已拒绝
            const req = circle.joinRequests.find(r => r.id === id);
            if (req) {
              req.status = 'rejected';
            }

            // 更新 globalData
            app.globalData.circles = circles;

            // 刷新页面
            this.loadCircles();

            wx.showToast({ title: '已拒绝', icon: 'none' });
          }
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