const app = getApp();
const { generateCircleInterpretation } = require('../../../utils/bailian');

Page({
  data: {
    circle: null,
    members: [],
    activeSection: 'members',
    isOwner: false,
    analysis: {
      gender: [],
      mbti: [],
      constellation: []
    },
    leaderboard: {
      partyKing: null,
      foodKing: null,
      organizerKing: null
    },
    stats: {
      totalGatherings: 0,
      totalDishes: 0,
      totalCities: 0
    },
    llmInterpretation: '',
    llmLoading: false,
    llmError: ''
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  async loadData() {
    try {
      await app.ensureBootstrap();
      const circleId = await app.ensureCurrentCircleSelected();
      if (!circleId) {
        wx.redirectTo({ url: '/pages/circle/index' });
        return;
      }

      const circleData = await app.loadCurrentCircleData();
      const circle = circleData ? circleData.circle : null;
      const members = circleData ? circleData.members || [] : [];
      const wishes = circleData ? circleData.wishes || [] : [];
      const currentUserId = app.getCurrentUserId();
      const isOwner = !!(circle && circle.ownerId === currentUserId);

      const genderMap = {};
      const mbtiMap = {};
      const constellationMap = {};
      members.forEach((member) => {
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
        isOwner,
        analysis: {
          gender: Object.entries(genderMap).map(([name, count]) => ({ name, count, percentage: members.length ? Math.round(count / members.length * 100) : 0 })),
          mbti: Object.entries(mbtiMap).map(([name, count]) => ({ name, count, percentage: members.length ? Math.round(count / members.length * 100) : 0 })),
          constellation: Object.entries(constellationMap).map(([name, count]) => ({ name, count, percentage: members.length ? Math.round(count / members.length * 100) : 0 }))
        },
        leaderboard: this.calculateLeaderboard(members, wishes),
        stats: this.calculateStats(wishes),
        llmError: ''
      });
    } catch (error) {
      wx.showToast({ title: error.message || '加载圈子失败', icon: 'none' });
    }
  },

  calculateLeaderboard(members, wishes) {
    const memberStats = {};
    members.forEach((member) => {
      memberStats[member.id] = {
        id: member.id,
        name: member.name,
        avatar: member.avatar,
        eventsJoined: 0,
        eventsCreated: 0,
        diningCount: 0
      };
    });

    wishes.forEach((wish) => {
      if (wish.creator && memberStats[wish.creator.id]) {
        memberStats[wish.creator.id].eventsCreated += 1;
      }
      (wish.claimed || []).forEach((claimer) => {
        if (claimer.user && memberStats[claimer.user.id]) {
          memberStats[claimer.user.id].eventsJoined += 1;
          if (wish.category === 'restaurant') {
            memberStats[claimer.user.id].diningCount += 1;
          }
        }
      });
    });

    const statsArray = Object.values(memberStats);
    const pick = (key) => statsArray.length ? statsArray.reduce((max, item) => item[key] > max[key] ? item : max, statsArray[0]) : null;
    const partyKing = pick('eventsJoined');
    const foodKing = pick('diningCount');
    const organizerKing = pick('eventsCreated');

    return {
      partyKing: partyKing && partyKing.eventsJoined > 0 ? partyKing : null,
      foodKing: foodKing && foodKing.diningCount > 0 ? foodKing : null,
      organizerKing: organizerKing && organizerKing.eventsCreated > 0 ? organizerKing : null
    };
  },

  calculateStats(wishes) {
    const now = new Date();
    return {
      totalGatherings: wishes.filter((item) => item.targetDate && new Date(item.targetDate) < now).length,
      totalDishes: wishes.filter((item) => item.category === 'restaurant').length,
      totalCities: wishes.filter((item) => item.category === 'travel').length
    };
  },

  getGenderLabel(value) {
    if (!value) return '未设置';
    const item = (app.GENDER_OPTIONS || []).find((option) => option.value === value);
    return item ? item.label : '未设置';
  },

  getConstellationLabel(value) {
    if (!value) return '';
    const item = (app.CONSTELLATION_OPTIONS || []).find((option) => option.value === value);
    return item ? item.label.split(' ')[0] : '';
  },

  switchSection(e) {
    const { section } = e.currentTarget.dataset;
    this.setData({ activeSection: section });
  },

  goToCircleList() {
    wx.navigateTo({ url: '/pages/circle/index' });
  },

  goToRenameCircle() {
    if (!this.data.isOwner) {
      wx.showToast({ title: '只有圈主可以改名', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: '/pages/circle/rename/index' });
  },

  goToCreate() {
    wx.navigateTo({ url: '/pages/create/index' });
  },

  handleGenerateInterpretation() {
    const { circle, members, llmLoading } = this.data;
    if (llmLoading) return;
    if (!circle || !members.length) {
      this.setData({ llmInterpretation: '', llmError: '当前圈子还没有圈友数据，先邀请成员加入后再试试。' });
      return;
    }

    this.setData({ llmLoading: true, llmError: '', llmInterpretation: '' });
    generateCircleInterpretation(circle._id)
      .then((text) => {
        this.setData({ llmInterpretation: text, llmLoading: false, llmError: '' });
      })
      .catch((error) => {
        this.setData({ llmInterpretation: '', llmLoading: false, llmError: error.message || '生成失败，请稍后重试。' });
      });
  },

  onShareAppMessage() {
    const { circle } = this.data;
    return {
      title: circle ? `${circle.name} - 圈友报告` : '圈子主页',
      path: '/pages/circle/home/index'
    };
  }
});
