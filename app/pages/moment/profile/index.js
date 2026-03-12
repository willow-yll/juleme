// 宠物/娃档案
const app = getApp();

Page({
  data: {
    id: null,
    type: null,
    item: null
  },

  onLoad(options) {
    const { id, type } = options;
    this.setData({ id, type });
    this.loadData();
  },

  onShow() {
    // 页面守卫：检查是否选择了圈子
    if (!app.globalData.currentCircleId) {
      wx.redirectTo({ url: '/pages/circle/index' });
      return;
    }
  },

  // 加载数据 - 从当前圈子获取
  loadData() {
    const { id, type } = this.data;
    const circleData = app.getCurrentCircleData();
    if (!circleData) {
      this.setData({ item: null });
      return;
    }

    let item = null;

    if (type === 'pet') {
      item = circleData.pets.find(p => p.id == id);
    } else {
      item = circleData.babies.find(b => b.id == id);
    }

    if (!item) {
      wx.showToast({ title: '档案不存在', icon: 'none' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }

    this.setData({ item });
  },

  // 投喂罐头
  handleFeed() {
    const { id, type, item } = this.data;
    if (!item) return;

    const circleData = app.getCurrentCircleData();
    if (!circleData) return;

    if (type === 'pet') {
      const newPets = circleData.pets.map(p => {
        if (p.id == id) {
          return { ...p, cans: (p.cans || 0) + 1 };
        }
        return p;
      });
      app.updateCurrentCircleCollection('pets', newPets);
      this.setData({ item: { ...item, cans: (item.cans || 0) + 1 } });
    } else {
      const newBabies = circleData.babies.map(b => {
        if (b.id == id) {
          return { ...b, cans: (b.cans || 0) + 1 };
        }
        return b;
      });
      app.updateCurrentCircleCollection('babies', newBabies);
      this.setData({ item: { ...item, cans: (item.cans || 0) + 1 } });
    }

    wx.showToast({ title: '投喂成功！🥫', icon: 'success' });
  },

  // 送爱心
  handleHeart() {
    const { id, type, item } = this.data;
    if (!item) return;

    const circleData = app.getCurrentCircleData();
    if (!circleData) return;

    if (type === 'pet') {
      const newPets = circleData.pets.map(p => {
        if (p.id == id) {
          return { ...p, hearts: (p.hearts || 0) + 1 };
        }
        return p;
      });
      app.updateCurrentCircleCollection('pets', newPets);
      this.setData({ item: { ...item, hearts: (item.hearts || 0) + 1 } });
    } else {
      const newBabies = circleData.babies.map(b => {
        if (b.id == id) {
          return { ...b, hearts: (b.hearts || 0) + 1 };
        }
        return b;
      });
      app.updateCurrentCircleCollection('babies', newBabies);
      this.setData({ item: { ...item, hearts: (item.hearts || 0) + 1 } });
    }

    wx.showToast({ title: '送爱心成功！❤️', icon: 'success' });
  },

  onShareAppMessage() {
    const { item } = this.data;
    return {
      title: item ? `${item.name}的档案` : '聚了吗 - 萌宠萌娃',
      path: `/pages/moment/profile?id=${this.data.id}&type=${this.data.type}`
    };
  }
});