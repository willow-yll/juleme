// 首页 - 动态墙
const app = getApp();

Page({
  data: {
    feedItems: [],
    currentDate: {
      week: '',
      month: 0,
      day: 0
    },
    likedItems: []
  },

  onLoad() {
    console.log('首页加载');
    this.initDate();
    this.loadFeedData();
  },

  onShow() {
    console.log('首页显示, app.globalData:', app.globalData);
    // 每次显示时刷新数据
    this.loadFeedData();
  },

  onPullDownRefresh() {
    this.loadFeedData();
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },

  // 初始化日期
  initDate() {
    const now = new Date();
    const weeks = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    this.setData({
      currentDate: {
        week: weeks[now.getDay()],
        month: now.getMonth() + 1,
        day: now.getDate()
      }
    });
  },

  // 加载动态数据
  loadFeedData() {
    const feedItems = app.globalData.feedItems || [];
    console.log('加载动态数据:', feedItems.length, '条');
    // 格式化数据
    this.setData({
      feedItems: feedItems.map(item => ({
        ...item,
        liked: this.data.likedItems.includes(item.id)
      }))
    });
  },

  // 点赞
  handleLike(e) {
    const { id } = e.currentTarget.dataset;
    const items = this.data.feedItems.map(item => {
      if (item.id === id) {
        const liked = !item.liked;
        const newLikedItems = [...this.data.likedItems];
        if (liked) {
          newLikedItems.push(id);
        } else {
          const idx = newLikedItems.indexOf(id);
          if (idx > -1) newLikedItems.splice(idx, 1);
        }
        this.setData({ likedItems: newLikedItems });
        return {
          ...item,
          liked,
          likes: liked ? item.likes + 1 : item.likes - 1
        };
      }
      return item;
    });
    this.setData({ feedItems: items });
  },

  // 评论
  handleComment(e) {
    const { id } = e.currentTarget.dataset;
    const item = this.data.feedItems.find(i => i.id === id);
    if (!item) return;

    wx.showModal({
      title: '发送弹幕',
      editable: true,
      placeholderText: '说点什么...',
      success: (res) => {
        if (res.confirm && res.content) {
          const newComments = [...item.comments, res.content];
          const items = this.data.feedItems.map(i =>
            i.id === id ? { ...i, comments: newComments } : i
          );
          this.setData({ feedItems: items });
          wx.showToast({ title: '发送成功', icon: 'success' });
        }
      }
    });
  },

  // 创建新内容
  handleCreate() {
    wx.navigateTo({
      url: '/pages/create/index'
    });
  },

  onShareAppMessage() {
    return {
      title: '聚了吗 - 愿望清单小程序',
      path: '/pages/index/index'
    };
  }
});