// 活动详情页面
const app = getApp();

const CURRENT_USER = { id: 'me', avatar: 'https://picsum.photos/100' };

Page({
  data: {
    wish: null,
    progress: 0,
    countdownText: '',
    isClaimed: false,
    isCreator: false,
    isCircleOwner: false,
    canDelete: false
  },

  onLoad(options) {
    const { id } = options;
    if (id) {
      this.loadWish(id);
    }
  },

  onShow() {
    // 页面守卫：检查是否选择了圈子
    if (!app.globalData.currentCircleId) {
      wx.redirectTo({ url: '/pages/circle/index' });
      return;
    }

    const { wish } = this.data;
    if (wish && wish.id) {
      this.loadWish(wish.id);
    }
  },

  getCurrentUser() {
    const userProfile = app.getUserProfile() || {};
    return {
      ...CURRENT_USER,
      name: userProfile.nickname || '我'
    };
  },

  // 加载活动 - 从当前圈子获取
  loadWish(id) {
    const circleData = app.getCurrentCircleData();
    if (!circleData) {
      wx.showToast({ title: '请先选择圈子', icon: 'none' });
      return;
    }

    const wish = circleData.wishes.find(w => w.id == id);

    if (wish) {
      const progress = this.calculateProgress(wish);
      const countdownText = this.getCountdownText(wish.targetDate);
      const isClaimed = wish.claimed && wish.claimed.some(c => c.user && c.user.id === CURRENT_USER.id);
      const isCreator = !!(wish.creator && wish.creator.id === CURRENT_USER.id);
      const currentCircle = app.globalData.currentCircle || {};
      const isCircleOwner = currentCircle.ownerId === CURRENT_USER.id;
      const canDelete = isCreator || isCircleOwner;

      this.setData({
        wish,
        progress,
        countdownText,
        isClaimed,
        isCreator,
        isCircleOwner,
        canDelete
      });
    } else {
      wx.showToast({ title: '活动不存在', icon: 'none' });
      setTimeout(() => {
        const pages = getCurrentPages();
        if (pages.length > 1) {
          wx.navigateBack();
          return;
        }
        wx.switchTab({ url: '/pages/wishlist/index' });
      }, 1500);
    }
  },

  // 计算进度
  calculateProgress(wish) {
    if (!wish.targetDate) return 0;
    const now = new Date();
    const created = new Date(wish.createdAt);
    const target = new Date(wish.targetDate);

    const total = target - created;
    const current = now - created;

    if (current >= total) return 100;
    return Math.min(Math.round((current / total) * 100), 100);
  },

  // 获取倒计时文本
  getCountdownText(targetDate) {
    if (!targetDate) return '';
    const now = new Date();
    const target = new Date(targetDate);

    const diff = target - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return '已结束';
    if (days === 0) return '就是今天！';
    if (days === 1) return '还剩 1 天';
    return `还剩 ${days} 天`;
  },

  // 报名
  handleClaim() {
    const { wish } = this.data;
    if (!wish) return;

    if (!wish.claimed) {
      wish.claimed = [];
    }

    const alreadyClaimed = wish.claimed.some(c => c.user && c.user.id === CURRENT_USER.id);
    if (alreadyClaimed) {
      wx.showToast({ title: '已经报名过了', icon: 'none' });
      return;
    }

    if (wish.claimed.length >= wish.maxClaim) {
      wx.showToast({ title: '名额已满啦', icon: 'none' });
      return;
    }

    const currentUser = this.getCurrentUser();
    const newClaimed = [...wish.claimed, {
      user: currentUser,
      wantGo: true
    }];

    app.updateWishClaimsInCurrentCircle(wish.id, newClaimed);

    this.setData({
      wish: { ...wish, claimed: newClaimed },
      isClaimed: true
    });

    // 添加动态到当前圈子
    app.addFeedItemToCurrentCircle({
      id: Date.now(),
      user: { avatar: currentUser.avatar, name: currentUser.name },
      type: 'wish',
      content: '报名了活动',
      title: wish.title,
      time: '刚刚',
      likes: 0,
      comments: []
    });

    wx.showToast({ title: '报名成功！', icon: 'success' });
  },

  // 取消报名
  handleCancelClaim() {
    const { wish } = this.data;
    if (!wish || !this.data.isClaimed) return;

    wx.showModal({
      title: '确认取消',
      content: '确定要取消报名该活动吗？',
      success: (res) => {
        if (res.confirm) {
          const newClaimed = wish.claimed.filter(c => c.user.id !== CURRENT_USER.id);

          app.updateWishClaimsInCurrentCircle(wish.id, newClaimed);

          this.setData({
            wish: { ...wish, claimed: newClaimed },
            isClaimed: false
          });

          wx.showToast({ title: '已取消报名', icon: 'success' });
        }
      }
    });
  },

  handleDelete() {
    const { wish, canDelete } = this.data;
    if (!wish || !canDelete) return;

    wx.showModal({
      title: '删除活动',
      content: '确定要删除这个活动吗？删除后不可恢复。',
      success: (res) => {
        if (!res.confirm) {
          return;
        }

        const removed = app.removeWishFromCurrentCircle(wish.id);
        if (!removed) {
          wx.showToast({ title: '活动不存在', icon: 'none' });
          return;
        }

        wx.showToast({ title: '活动已删除', icon: 'success' });
        setTimeout(() => {
          wx.switchTab({ url: '/pages/wishlist/index' });
        }, 1200);
      }
    });
  },

  // 分享
  handleShare() {
    wx.showToast({ title: '点击右上角分享', icon: 'none' });
  },

  onShareAppMessage() {
    const { wish } = this.data;
    return {
      title: wish ? `一起参加"${wish.title}"吧！` : '聚了吗 - 活动',
      path: `/pages/wishlist/detail?id=${wish?.id}`
    };
  }
});