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
    console.log('活动页面加载');
    this.loadWishes();
  },

  onShow() {
    console.log('活动页面显示');
    // 页面守卫：检查是否选择了圈子
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

  // 加载活动数据 - 从当前圈子获取
  loadWishes() {
    const circleData = app.getCurrentCircleData();
    const wishes = circleData ? circleData.wishes : [];
    console.log('加载活动, 总数:', wishes.length);

    // 标记当前用户是否已报名
    const wishesWithClaim = wishes.map(w => ({
      ...w,
      hasClaimed: w.claimed && w.claimed.some(c => c.user && c.user.name === '我'),
      isEnded: w.targetDate && new Date(w.targetDate) < new Date()
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

  // 过滤活动 - 时间轴形式
  filterWishes() {
    const { wishes, activeTab } = this.data;

    let filtered = [];
    switch (activeTab) {
      case 'all':
        // 全部 - 按时间排序（未来的在前，过期的在后）
        filtered = [...wishes].sort((a, b) => {
          if (!a.targetDate) return 1;
          if (!b.targetDate) return -1;
          return new Date(a.targetDate) - new Date(b.targetDate);
        });
        break;
      case 'my':
        // 我参加的 - 我报名的活动，包括已结束的
        filtered = wishes.filter(w => w.hasClaimed).sort((a, b) => {
          if (!a.targetDate) return 1;
          if (!b.targetDate) return -1;
          return new Date(a.targetDate) - new Date(b.targetDate);
        });
        break;
    }

    // 转换为时间轴格式
    const timelineWishes = this.buildTimeline(filtered);

    this.setData({ filteredWishes: filtered, timelineWishes });
  },

  // 构建时间轴
  buildTimeline(wishes) {
    const timeline = [];
    wishes.forEach((wish, index) => {
      const date = wish.targetDate ? new Date(wish.targetDate) : null;
      let dateLabel = '待定';

      if (date) {
        const now = new Date();
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const diff = date - now;
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

        if (days < 0) {
          dateLabel = `${year}年${month}月${day}日 (已结束)`;
        } else if (days === 0) {
          dateLabel = '今天';
        } else if (days <= 7) {
          dateLabel = `${days}天后`;
        } else {
          dateLabel = `${month}月${day}日`;
        }
      }

      timeline.push({
        ...wish,
        dateLabel,
        isPast: wish.isEnded,
        isToday: wish.targetDate && new Date(wish.targetDate).toDateString() === new Date().toDateString()
      });
    });

    return timeline;
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
      url: `/pages/wishlist/detail/index?id=${id}`
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
    if (!wish.claimed) {
      wish.claimed = [];
    }
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

    // 更新当前圈子的数据
    const circleData = app.getCurrentCircleData();
    if (circleData) {
      const wishIndex = circleData.wishes.findIndex(w => w.id === id);
      if (wishIndex > -1) {
        circleData.wishes[wishIndex].claimed = newClaimed;
      }
    }

    // 添加动态到当前圈子
    app.addFeedItemToCurrentCircle({
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

  // 取消报名
  handleCancelClaim(e) {
    const { id } = e.currentTarget.dataset;
    const wish = this.data.wishes.find(w => w.id === id);

    if (!wish || !wish.hasClaimed) return;

    wx.showModal({
      title: '确认取消',
      content: '确定要取消报名该活动吗？',
      success: (res) => {
        if (res.confirm) {
          const newClaimed = wish.claimed.filter(c => c.user.name !== '我');
          const newWishes = this.data.wishes.map(w =>
            w.id === id ? { ...w, claimed: newClaimed, hasClaimed: false } : w
          );

          this.setData({ wishes: newWishes });
          this.filterWishes();

          // 更新当前圈子的数据
          const circleData = app.getCurrentCircleData();
          if (circleData) {
            const wishIndex = circleData.wishes.findIndex(w => w.id === id);
            if (wishIndex > -1) {
              circleData.wishes[wishIndex].claimed = newClaimed;
            }
          }

          wx.showToast({ title: '已取消报名', icon: 'success' });
        }
      }
    });
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