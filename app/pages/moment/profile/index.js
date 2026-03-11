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

  // 加载数据
  loadData() {
    const { id, type } = this.data;
    let item = null;

    if (type === 'pet') {
      item = app.globalData.pets.find(p => p.id == id);
    } else {
      item = app.globalData.babies.find(b => b.id == id);
    }

    this.setData({ item });
  },

  // 投喂罐头
  handleFeed() {
    const { id, type, item } = this.data;
    if (!item) return;

    if (type === 'pet') {
      const newPets = app.globalData.pets.map(p => {
        if (p.id == id) {
          return { ...p, cans: (p.cans || 0) + 1 };
        }
        return p;
      });
      app.globalData.pets = newPets;
    } else {
      const newBabies = app.globalData.babies.map(b => {
        if (b.id == id) {
          return { ...b, cans: (b.cans || 0) + 1 };
        }
        return b;
      });
      app.globalData.babies = newBabies;
    }

    this.setData({ item: { ...item, cans: (item.cans || 0) + 1 } });
    wx.showToast({ title: '投喂成功！🥫', icon: 'success' });
  },

  // 送爱心
  handleHeart() {
    const { id, type, item } = this.data;
    if (!item) return;

    if (type === 'pet') {
      const newPets = app.globalData.pets.map(p => {
        if (p.id == id) {
          return { ...p, hearts: (p.hearts || 0) + 1 };
        }
        return p;
      });
      app.globalData.pets = newPets;
    } else {
      const newBabies = app.globalData.babies.map(b => {
        if (b.id == id) {
          return { ...b, hearts: (b.hearts || 0) + 1 };
        }
        return b;
      });
      app.globalData.babies = newBabies;
    }

    this.setData({ item: { ...item, hearts: (item.hearts || 0) + 1 } });
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