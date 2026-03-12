// 活动页面 - 时间轴形式
const app = getApp();

Page({
  data: {
    wishes: [],
    filteredWishes: [],
    activeTab: 'all',
    timelineWishes: []
  },

  onLoad() {
    this.loadWishes();
  },

  onShow() {
    this.loadWishes();
  },

  onPullDownRefresh() {
    this.loadWishes().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  async loadWishes() {
    try {
      await app.ensureBootstrap();
      const circleId = await app.ensureCurrentCircleSelected();
      if (!circleId) {
        wx.redirectTo({ url: '/pages/circle/index' });
        return;
      }

      const circleData = await app.loadCurrentCircleData();
      const currentUserId = app.getCurrentUserId();
      const wishes = (circleData ? circleData.wishes : []).map((wish) => ({
        ...wish,
        hasClaimed: (wish.claimed || []).some((claim) => claim.user && claim.user.id === currentUserId),
        isEnded: wish.targetDate && new Date(wish.targetDate) < new Date()
      }));

      this.setData({ wishes });
      this.filterWishes();
    } catch (error) {
      wx.showToast({ title: error.message || '加载活动失败', icon: 'none' });
    }
  },

  switchTab(e) {
    const { tab } = e.currentTarget.dataset;
    this.setData({ activeTab: tab });
    this.filterWishes();
  },

  filterWishes() {
    const { wishes, activeTab } = this.data;
    let filtered = [];
    switch (activeTab) {
      case 'my':
        filtered = wishes.filter((wish) => wish.hasClaimed).sort((a, b) => new Date(a.targetDate || '2999-12-31') - new Date(b.targetDate || '2999-12-31'));
        break;
      case 'all':
      default:
        filtered = [...wishes].sort((a, b) => new Date(a.targetDate || '2999-12-31') - new Date(b.targetDate || '2999-12-31'));
        break;
    }

    this.setData({
      filteredWishes: filtered,
      timelineWishes: this.buildTimeline(filtered)
    });
  },

  buildTimeline(wishes) {
    return wishes.map((wish) => {
      const date = wish.targetDate ? new Date(wish.targetDate) : null;
      let dateLabel = '待定';
      if (date) {
        const now = new Date();
        const diff = date - now;
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        if (days < 0) {
          dateLabel = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 (已结束)`;
        } else if (days === 0) {
          dateLabel = '今天';
        } else if (days <= 7) {
          dateLabel = `${days}天后`;
        } else {
          dateLabel = `${date.getMonth() + 1}月${date.getDate()}日`;
        }
      }
      return {
        ...wish,
        dateLabel,
        isPast: wish.isEnded,
        isToday: wish.targetDate && new Date(wish.targetDate).toDateString() === new Date().toDateString()
      };
    });
  },

  goToDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/wishlist/detail/index?id=${id}` });
  },

  async handleClaim(e) {
    const { id } = e.currentTarget.dataset;
    try {
      await app.toggleWishClaim(id, 'claim');
      await this.loadWishes();
      wx.showToast({ title: '报名成功！', icon: 'success' });
    } catch (error) {
      wx.showToast({ title: error.message || '报名失败', icon: 'none' });
    }
  },

  handleCancelClaim(e) {
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: '确认取消',
      content: '确定要取消报名该活动吗？',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await app.toggleWishClaim(id, 'cancel');
          await this.loadWishes();
          wx.showToast({ title: '已取消报名', icon: 'success' });
        } catch (error) {
          wx.showToast({ title: error.message || '取消失败', icon: 'none' });
        }
      }
    });
  },

  stopPropagation() {},

  goToCreate() {
    wx.navigateTo({ url: '/pages/create/index?type=wish' });
  },

  onShareAppMessage() {
    return {
      title: '聚了吗 - 活动',
      path: '/pages/wishlist/index'
    };
  }
});
