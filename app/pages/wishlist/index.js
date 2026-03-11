// 活动页面
const app = getApp();

Page({
  data: {
    wishes: [],
    filteredWishes: [],
    activeTab: 'all'
  },

  onLoad() {
    console.log('活动页面加载');
    this.loadWishes();
  },

  onShow() {
    console.log('活动页面显示');
    if (!app.globalData.currentCircleId) {
      wx.redirectTo({ url: '/pages/circle/index' });
      return;
    }
    this.loadWishes();
  },

  onPullDownRefresh() {
    this.loadWishes();
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },

  // 加载活动数据
  loadWishes() {
    const wishes = app.globalData.wishes || [];
    console.log('加载活动, 总数:', wishes.length);

    // 标记当前用户是否已报名
    const wishesWithClaim = wishes.map(w => ({
      ...w,
      hasClaimed: w.claimed.some(c => c.user.name === '我')
    }));

    this.setData({ wishes: wishesWithClaim });
    this.filterWishes();
  },

  // 切换标签
  switchTab(e) {
    const { tab } = e.currentTarget.dataset;
    this.setData({ activeTab: tab });
    this.filterWishes();
  },

  // 过滤活动
  filterWishes() {
    const { wishes, activeTab } = this.data;

    let filtered = [];
    switch (activeTab) {
      case 'all':
        filtered = wishes;
        break;
      case 'active':
        filtered = wishes.filter(w => w.status === 'active');
        break;
      case 'done':
        filtered = wishes.filter(w => w.status === 'done');
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

    if (days < 0) return '已结束';
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

  // 报名活动
  handleClaim(e) {
    const { id } = e.currentTarget.dataset;
    const wish = this.data.wishes.find(w => w.id === id);

    if (!wish) return;

    // 检查是否已报名
    if (wish.hasClaimed) {
      wx.showToast({ title: '已经报名过了', icon: 'none' });
      return;
    }

    // 检查是否已满
    if (wish.claimed.length >= wish.maxClaim) {
      wx.showToast({ title: '名额已满啦', icon: 'none' });
      return;
    }

    // 报名
    const newClaimed = [...wish.claimed, { user: { avatar: 'https://picsum.photos/100', name: '我' }, wantGo: true }];
    const newWishes = this.data.wishes.map(w =>
      w.id === id ? { ...w, claimed: newClaimed, hasClaimed: true } : w
    );

    this.setData({ wishes: newWishes });
    this.filterWishes();

    // 添加动态
    app.globalData.feedItems.unshift({
      id: Date.now(),
      user: { avatar: 'https://picsum.photos/100', name: '我' },
      type: 'wish',
      content: '报名了活动',
      title: wish.title,
      time: '刚刚',
      likes: 0,
      comments: []
    });

    wx.showToast({ title: '报名成功！', icon: 'success' });
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
      title: '聚了吗 - 活动',
      path: '/pages/wishlist/index'
    };
  }
});