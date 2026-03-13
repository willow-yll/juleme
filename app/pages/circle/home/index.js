const app = getApp();
const { generateCircleInterpretation } = require('../../../utils/bailian');

Page({
  data: {
    circle: null,
    members: [],
    pendingRequests: [],
    activeSection: 'members',
    isOwner: false,
    loading: true,
    pageError: '',
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
    llmInterpretationLines: [],
    llmLoading: false,
    llmError: ''
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    if (this.hasLoadedOnce) {
      this.loadData();
    }
  },

  async loadData() {
    this.setData({ loading: true, pageError: '' });
    try {
      await app.ensureBootstrap();
      const hasProfile = app.hasUserProfile();
      const circleId = await app.ensureCurrentCircleSelected();
      if (!circleId) {
        this.setData({ loading: false, circle: null });
        if (!hasProfile) {
          wx.reLaunch({ url: '/pages/profile/setup/index' });
          return;
        }
        wx.reLaunch({ url: '/pages/circle/index' });
        return;
      }

      const cachedData = app.getCurrentCircleData();
      const initialData = cachedData && cachedData.circle && cachedData.circle._id === circleId
        ? cachedData
        : await app.loadCurrentCircleData();

      await this.applyCircleData(initialData);
      this.hasLoadedOnce = true;

      app.loadCurrentCircleData({ force: true })
        .then((freshData) => this.applyCircleData(freshData))
        .catch(() => null);
    } catch (error) {
      this.setData({
        loading: false,
        circle: null,
        pageError: error.message || '加载圈子失败'
      });
      wx.showToast({ title: error.message || '加载圈子失败', icon: 'none' });
    }
  },

  async applyCircleData(circleData) {
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
      loading: false,
      pageError: '',
      analysis: {
        gender: Object.entries(genderMap).map(([name, count]) => ({ name, count, percentage: members.length ? Math.round(count / members.length * 100) : 0 })),
        mbti: Object.entries(mbtiMap).map(([name, count]) => ({ name, count, percentage: members.length ? Math.round(count / members.length * 100) : 0 })),
        constellation: Object.entries(constellationMap).map(([name, count]) => ({ name, count, percentage: members.length ? Math.round(count / members.length * 100) : 0 }))
      },
      leaderboard: this.calculateLeaderboard(members, wishes),
      stats: this.calculateStats(wishes),
      llmError: ''
    });

    if (isOwner && circle && circle._id) {
      this.loadPendingRequests(circle._id)
        .then((pendingRequests) => {
          this.setData({ pendingRequests });
        })
        .catch(() => {
          this.setData({ pendingRequests: [] });
        });
    } else {
      this.setData({ pendingRequests: [] });
    }
  },

  async loadPendingRequests(circleId) {
    if (!circleId) {
      return [];
    }
    const result = await app.loadCircleList({ force: true });
    const pendingRequests = Array.isArray(result && result.pendingRequests) ? result.pendingRequests : [];
    return pendingRequests
      .filter((item) => item.circleId === circleId)
      .map((item) => ({
        id: item._id,
        circleId: item.circleId,
        userName: item.applicantName,
        userAvatar: item.applicantAvatar,
        circleName: item.circleName,
        status: item.status
      }));
  },

  async acceptRequest(e) {
    const { id } = e.currentTarget.dataset;
    const request = this.data.pendingRequests.find((item) => item.id === id);
    if (!request) {
      wx.showToast({ title: '申请不存在', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认同意',
      content: `同意「${request.userName}」加入圈子？`,
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await app.reviewJoinRequest({ circleId: request.circleId, requestId: id, status: 'approved' });
          await this.loadData();
          wx.showToast({ title: '已同意加入', icon: 'success' });
        } catch (error) {
          wx.showToast({ title: error.message || '处理失败', icon: 'none' });
        }
      }
    });
  },

  async rejectRequest(e) {
    const { id } = e.currentTarget.dataset;
    const request = this.data.pendingRequests.find((item) => item.id === id);
    if (!request) {
      wx.showToast({ title: '申请不存在', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认拒绝',
      content: `拒绝「${request.userName}」加入圈子？`,
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await app.reviewJoinRequest({ circleId: request.circleId, requestId: id, status: 'rejected' });
          await this.loadData();
          wx.showToast({ title: '已拒绝', icon: 'none' });
        } catch (error) {
          wx.showToast({ title: error.message || '处理失败', icon: 'none' });
        }
      }
    });
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
      this.setData({ llmInterpretation: '', llmInterpretationLines: [], llmError: '当前圈子还没有圈友数据，先邀请成员加入后再试试。' });
      return;
    }

    this.setData({ llmLoading: true, llmError: '', llmInterpretation: '', llmInterpretationLines: [] });
    generateCircleInterpretation(circle._id)
      .then((text) => {
        // 按句号、换行、分号分割成数组
        const lines = text
          .split(/[。\n；]/)
          .map((line) => line.trim())
          .filter((line) => line.length > 0);
        this.setData({
          llmInterpretation: text,
          llmInterpretationLines: lines,
          llmLoading: false,
          llmError: ''
        });
      })
      .catch((error) => {
        this.setData({ llmInterpretation: '', llmInterpretationLines: [], llmLoading: false, llmError: error.message || '生成失败，请稍后重试。' });
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
