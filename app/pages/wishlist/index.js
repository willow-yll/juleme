// 愿望清单页面
const app = getApp();

Page({
  data: {
    wishes: [],
    filteredWishes: [],
    activeTab: 'all',
    museum: []
  },

  onLoad() {
    this.loadWishes();
  },

  onShow() {
    this.loadWishes();
  },

  onPullDownRefresh() {
    this.loadWishes();
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },

  // 加载愿望数据
  loadWishes() {
    const wishes = app.globalData.wishes || [];
    const museum = app.globalData.museum || [];
    this.setData({ wishes, museum });
    this.filterWishes();
  },

  // 切换标签
  switchTab(e) {
    const { tab } = e.currentTarget.dataset;
    this.setData({ activeTab: tab });
    this.filterWishes();
  },

  // 过滤愿望
  filterWishes() {
    const { wishes, activeTab, museum } = this.data;

    let filtered = [];
    switch (activeTab) {
      case 'all':
        filtered = wishes.filter(w => w.status === 'active');
        break;
      case 'active':
        filtered = wishes.filter(w => w.status === 'active');
        break;
      case 'done':
        filtered = wishes.filter(w => w.status === 'done');
        break;
      case 'museum':
        filtered = museum;
        break;
    }

    this.setData({ filteredWishes: filtered });
  },

  // 获取进度百分比
  getProgress(item) {
    if (!item.targetDate) return 0;
    const now = new Date();
    const created = new Date(item.createdAt);
    const target = new Date(item.targetDate);

    const total = target - created;
    const current = now - created;

    if (current >= total) return 100;
    return Math.min(Math.round((current / total) * 100), 100);
  },

  // 获取进度文本
  getProgressText(item) {
    if (!item.targetDate) return '待定';
    const now = new Date();
    const target = new Date(item.targetDate);

    const diff = target - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return '已过期';
    if (days === 0) return '就是今天！';
    return `还剩 ${days} 天`;
  },

  // 跳转详情
  goToDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/wishlist/detail?id=${id}`
    });
  },

  // 认领愿望
  handleClaim(e) {
    const { id } = e.currentTarget.dataset;
    const wish = this.data.wishes.find(w => w.id === id);

    if (!wish) return;

    // 检查是否已认领
    const isClaimed = wish.claimed.some(c => c.user.name === '我');
    if (isClaimed) {
      wx.showToast({ title: '已经认领过了', icon: 'none' });
      return;
    }

    // 检查是否已满
    if (wish.claimed.length >= wish.maxClaim) {
      wx.showToast({ title: '已满员啦', icon: 'none' });
      return;
    }

    // 模拟认领
    const newClaimed = [...wish.claimed, { user: { avatar: 'https://picsum.photos/100', name: '我' }, wantGo: true }];
    const newWishes = this.data.wishes.map(w =>
      w.id === id ? { ...w, claimed: newClaimed } : w
    );

    this.setData({ wishes: newWishes });
    this.filterWishes();

    // 添加动态
    app.globalData.feedItems.unshift({
      id: Date.now(),
      user: { avatar: 'https://picsum.photos/100', name: '我' },
      type: 'wish',
      content: '认领了愿望',
      title: wish.title,
      time: '刚刚',
      likes: 0,
      comments: []
    });

    wx.showToast({ title: '认领成功！', icon: 'success' });
  },

  // 点赞
  handleLike(e) {
    const { id } = e.currentTarget.dataset;
    const wishes = this.data.wishes.map(w => {
      if (w.id === id) {
        return { ...w, likes: w.likes + 1 };
      }
      return w;
    });
    this.setData({ wishes });
    this.filterWishes();
  },

  // 阻止冒泡
  stopPropagation() {},

  // 跳转创建
  goToCreate() {
    wx.navigateTo({
      url: '/pages/create/index?type=wish'
    });
  },

  onShareAppMessage() {
    return {
      title: '聚了吗 - 愿望清单',
      path: '/pages/wishlist/index'
    };
  }
});