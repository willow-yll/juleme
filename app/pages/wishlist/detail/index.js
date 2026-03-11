// 愿望详情页面
const app = getApp();

Page({
  data: {
    wish: null,
    progress: 0,
    countdownText: '',
    isClaimed: false
  },

  onLoad(options) {
    const { id } = options;
    if (id) {
      this.loadWish(id);
    }
  },

  // 加载愿望
  loadWish(id) {
    const wish = app.globalData.wishes.find(w => w.id == id);

    if (wish) {
      const progress = this.calculateProgress(wish);
      const countdownText = this.getCountdownText(wish.targetDate);
      const isClaimed = wish.claimed.some(c => c.user.name === '我');

      this.setData({ wish, progress, countdownText, isClaimed });
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

    if (days < 0) return '已过期';
    if (days === 0) return '就是今天！';
    if (days === 1) return '还剩 1 天';
    return `还剩 ${days} 天`;
  },

  // 认领
  handleClaim() {
    const { wish } = this.data;
    if (!wish) return;

    if (wish.claimed.length >= wish.maxClaim) {
      wx.showToast({ title: '已满员啦', icon: 'none' });
      return;
    }

    const newClaimed = [...wish.claimed, {
      user: { avatar: 'https://picsum.photos/100', name: '我' },
      wantGo: true
    }];

    const newWishes = app.globalData.wishes.map(w =>
      w.id === wish.id ? { ...w, claimed: newClaimed } : w
    );

    app.globalData.wishes = newWishes;

    this.setData({
      wish: { ...wish, claimed: newClaimed },
      isClaimed: true
    });

    wx.showToast({ title: '认领成功！', icon: 'success' });
  },

  // 点亮愿望
  handleLightUp() {
    const { wish } = this.data;

    wx.showModal({
      title: '点亮愿望',
      content: '确认点亮此愿望？将进入回忆博物馆！',
      confirmText: '点亮',
      success: (res) => {
        if (res.confirm) {
          // 添加到回忆博物馆
          const museumItem = {
            id: Date.now(),
            wish: { title: wish.title, category: wish.category },
            images: [],
            participants: wish.claimed.map(c => c.user.name),
            feeling: '',
            createdAt: new Date().toISOString().split('T')[0]
          };

          app.globalData.museum.push(museumItem);

          // 更新愿望状态
          const newWishes = app.globalData.wishes.map(w =>
            w.id === wish.id ? { ...w, status: 'done' } : w
          );
          app.globalData.wishes = newWishes;

          // 添加动态
          app.globalData.feedItems.unshift({
            id: Date.now(),
            user: { avatar: 'https://picsum.photos/100', name: '我' },
            type: 'wish',
            content: '点亮了愿望',
            title: wish.title,
            time: '刚刚',
            likes: 0,
            comments: []
          });

          wx.showToast({ title: '已点亮！✨', icon: 'success' });

          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        }
      }
    });
  },

  // 分享
  handleShare() {
    // 触发分享
  },

  onShareAppMessage() {
    const { wish } = this.data;
    return {
      title: wish ? `一起完成 "${wish.title}" 吧！` : '聚了吗 - 愿望清单',
      path: `/pages/wishlist/detail?id=${wish?.id}`
    };
  }
});