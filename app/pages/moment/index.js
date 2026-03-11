// 萌宠/萌娃墙
const app = getApp();

Page({
  data: {
    activeType: 'pet',
    pets: [],
    babies: [],
    currentItems: [],
    currentMoments: []
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  // 加载数据
  loadData() {
    const pets = app.globalData.pets || [];
    const babies = app.globalData.babies || [];

    this.setData({ pets, babies });
    this.updateCurrentData();
  },

  // 切换类型
  switchType(e) {
    const { type } = e.currentTarget.dataset;
    this.setData({ activeType: type });
    this.updateCurrentData();
  },

  // 更新当前数据
  updateCurrentData() {
    const { activeType, pets, babies } = this.data;

    if (activeType === 'pet') {
      this.setData({
        currentItems: pets,
        currentMoments: this.getAllMoments(pets)
      });
    } else {
      this.setData({
        currentItems: babies,
        currentMoments: this.getAllMoments(babies)
      });
    }
  },

  // 获取所有瞬间
  getAllMoments(items) {
    const moments = [];
    items.forEach(item => {
      if (item.moments) {
        item.moments.forEach(m => {
          moments.push({ ...m, name: item.name, avatar: item.avatar });
        });
      }
    });
    return moments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  // 投喂罐头
  handleCans(e) {
    const { id } = e.currentTarget.dataset;
    const { activeType, pets, babies } = this.data;

    if (activeType === 'pet') {
      const newPets = pets.map(p => {
        const moment = p.moments && p.moments.find(m => m.id === id);
        if (moment) {
          moment.cans = (moment.cans || 0) + 1;
          p.cans = (p.cans || 0) + 1;
        }
        return p;
      });
      this.setData({ pets: newPets });
      app.globalData.pets = newPets;
    } else {
      const newBabies = babies.map(b => {
        const moment = b.moments && b.moments.find(m => m.id === id);
        if (moment) {
          moment.cans = (moment.cans || 0) + 1;
          b.cans = (b.cans || 0) + 1;
        }
        return b;
      });
      this.setData({ babies: newBabies });
      app.globalData.babies = newBabies;
    }

    wx.showToast({ title: '投喂成功！🥫', icon: 'success' });
    this.updateCurrentData();
  },

  // 点赞爱心
  handleHearts(e) {
    const { id } = e.currentTarget.dataset;
    const { activeType, pets, babies } = this.data;

    if (activeType === 'pet') {
      const newPets = pets.map(p => {
        const moment = p.moments && p.moments.find(m => m.id === id);
        if (moment) {
          moment.hearts = (moment.hearts || 0) + 1;
          p.hearts = (p.hearts || 0) + 1;
        }
        return p;
      });
      this.setData({ pets: newPets });
      app.globalData.pets = newPets;
    } else {
      const newBabies = babies.map(b => {
        const moment = b.moments && b.moments.find(m => m.id === id);
        if (moment) {
          moment.hearts = (moment.hearts || 0) + 1;
          b.hearts = (b.hearts || 0) + 1;
        }
        return b;
      });
      this.setData({ babies: newBabies });
      app.globalData.babies = newBabies;
    }

    wx.showToast({ title: '点赞成功！❤️', icon: 'success' });
    this.updateCurrentData();
  },

  // 跳转档案页
  goToProfile(e) {
    const { id, type } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/moment/profile?id=${id}&type=${type}`
    });
  },

  // 跳转创建
  goToCreate() {
    wx.navigateTo({
      url: `/pages/create/index?type=moment&subType=${this.data.activeType}`
    });
  },

  onShareAppMessage() {
    return {
      title: '聚了吗 - 萌宠萌娃墙',
      path: '/pages/moment/index'
    };
  }
});