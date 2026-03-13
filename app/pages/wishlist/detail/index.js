// 活动详情页面
const app = getApp();

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
    const { wish } = this.data;
    if (wish && wish.id) {
      this.loadWish(wish.id);
    }
  },

  // 加载活动 - 从当前圈子获取
  async loadWish(id) {
    try {
      await app.ensureBootstrap();
      const circleId = await app.ensureCurrentCircleSelected();
      if (!circleId) {
        wx.redirectTo({ url: '/pages/circle/index' });
        return;
      }

      const circleData = await app.loadCurrentCircleData();
      const currentUserId = app.getCurrentUserId();
      const wishes = circleData && Array.isArray(circleData.wishes) ? circleData.wishes : [];
      const wish = wishes.find((item) => item.id == id);

      if (!wish) {
        wx.showToast({ title: '活动不存在', icon: 'none' });
        setTimeout(() => {
          const pages = getCurrentPages();
          if (pages.length > 1) {
            wx.navigateBack();
            return;
          }
          wx.switchTab({ url: '/pages/wishlist/index' });
        }, 1500);
        return;
      }

      const normalizedWish = {
        ...wish,
        claimed: Array.isArray(wish.claimed) ? wish.claimed : []
      };
      const progress = this.calculateProgress(normalizedWish);
      const countdownText = this.getCountdownText(normalizedWish.targetDate);
      const isClaimed = normalizedWish.claimed.some((claim) => claim.user && claim.user.id === currentUserId);
      const isCreator = !!(normalizedWish.creator && normalizedWish.creator.id === currentUserId);
      const currentCircle = circleData && circleData.circle ? circleData.circle : (app.getCurrentCircle() || {});
      const isCircleOwner = currentCircle.ownerId === currentUserId;
      const canDelete = isCreator || isCircleOwner;

      this.setData({
        wish: normalizedWish,
        progress,
        countdownText,
        isClaimed,
        isCreator,
        isCircleOwner,
        canDelete
      });
    } catch (error) {
      wx.showToast({ title: error.message || '加载活动失败', icon: 'none' });
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
  async handleClaim() {
    const { wish, isClaimed } = this.data;
    if (!wish) return;

    if (isClaimed) {
      wx.showToast({ title: '已经报名过了', icon: 'none' });
      return;
    }

    const claimed = Array.isArray(wish.claimed) ? wish.claimed : [];
    if (wish.maxClaim && claimed.length >= wish.maxClaim) {
      wx.showToast({ title: '名额已满啦', icon: 'none' });
      return;
    }

    try {
      await app.toggleWishClaim(wish.id, 'claim');
      await this.loadWish(wish.id);
      wx.showToast({ title: '报名成功！', icon: 'success' });
    } catch (error) {
      wx.showToast({ title: error.message || '报名失败', icon: 'none' });
    }
  },

  // 取消报名
  handleCancelClaim() {
    const { wish } = this.data;
    if (!wish || !this.data.isClaimed) return;

    wx.showModal({
      title: '确认取消',
      content: '确定要取消报名该活动吗？',
      success: async (res) => {
        if (!res.confirm) {
          return;
        }

        try {
          await app.toggleWishClaim(wish.id, 'cancel');
          await this.loadWish(wish.id);
          wx.showToast({ title: '已取消报名', icon: 'success' });
        } catch (error) {
          wx.showToast({ title: error.message || '取消失败', icon: 'none' });
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

        wx.showLoading({ title: '删除中...' });
        app.deleteWish(wish.id)
          .then(() => {
            wx.hideLoading();
            wx.showToast({ title: '活动已删除', icon: 'success' });
            setTimeout(() => {
              const pages = getCurrentPages();
              if (pages.length > 1) {
                wx.navigateBack();
                return;
              }
              wx.switchTab({ url: '/pages/wishlist/index' });
            }, 300);
          })
          .catch((error) => {
            wx.hideLoading();
            wx.showToast({ title: error.message || '删除失败', icon: 'none' });
          });
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
      title: wish ? `一起参加\"${wish.title}\"吧！` : '聚了吗 - 活动',
      path: '/pages/wishlist/detail?id=' + (wish && wish.id ? wish.id : '')
    };
  }
});