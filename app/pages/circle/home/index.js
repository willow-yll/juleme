// 圈子主页
const app = getApp();

Page({
  data: {
    circle: null,
    members: [],
    activeSection: 'members',
    analysis: {
      gender: [],
      mbti: [],
      constellation: []
    }
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    if (!app.globalData.currentCircleId) {
      wx.redirectTo({ url: '/pages/circle/index' });
      return;
    }
    this.loadData();
  },

  loadData() {
    const circle = app.globalData.currentCircle;
    if (!circle) return;

    const members = circle.members || [];
    const genderMap = {};
    const mbtiMap = {};
    const constellationMap = {};

    members.forEach(member => {
      const genderLabel = this.getGenderLabel(member.gender);
      genderMap[genderLabel] = (genderMap[genderLabel] || 0) + 1;

      if (member.mbti) {
        mbtiMap[member.mbti] = (mbtiMap[member.mbti] || 0) + 1;
      }

      const constellationLabel = this.getConstellationLabel(member.constellation);
      if (constellationLabel) {
        constellationMap[constellationLabel] = (constellationMap[constellationLabel] || 0) + 1;
      }
    });

    this.setData({
      circle,
      members,
      analysis: {
        gender: Object.entries(genderMap).map(([name, count]) => ({
          name,
          count,
          percentage: members.length ? Math.round(count / members.length * 100) : 0
        })),
        mbti: Object.entries(mbtiMap).map(([name, count]) => ({
          name,
          count,
          percentage: members.length ? Math.round(count / members.length * 100) : 0
        })),
        constellation: Object.entries(constellationMap).map(([name, count]) => ({
          name,
          count,
          percentage: members.length ? Math.round(count / members.length * 100) : 0
        }))
      }
    });
  },

  getGenderLabel(value) {
    if (!value) return '未设置';
    const item = (app.GENDER_OPTIONS || []).find(option => option.value === value);
    return item ? item.label : '未设置';
  },

  getConstellationLabel(value) {
    if (!value) return '';
    const item = (app.CONSTELLATION_OPTIONS || []).find(option => option.value === value);
    return item ? item.label.split(' ')[0] : '';
  },

  switchSection(e) {
    const { section } = e.currentTarget.dataset;
    this.setData({ activeSection: section });
  },

  goToCircleList() {
    wx.navigateTo({ url: '/pages/circle/index' });
  },

  goToCreate() {
    wx.navigateTo({ url: '/pages/create/index' });
  },

  onShareAppMessage() {
    const { circle } = this.data;
    return {
      title: circle ? `${circle.name} - 圈友报告` : '圈子主页',
      path: '/pages/circle/home/index'
    };
  }
});