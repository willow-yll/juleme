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
    },
    // 新增：排行榜数据
    leaderboard: {
      partyKing: null,      // 捧场王 - 参加活动最多
      foodKing: null,       // 干饭王 - 最常聚餐
      organizerKing: null   // 局头 - 发起活动最多
    },
    // 新增：统计数据
    stats: {
      totalGatherings: 0,   // 共聚会次数
      totalDishes: 0,       // 一起吃了多少道菜
      totalCities: 0        // 足迹多少个城市
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
    const circleData = app.getCurrentCircleData();
    const wishes = circleData ? circleData.wishes : [];

    const genderMap = {};
    const mbtiMap = {};
    const constellationMap = {};

    // 统计成员属性
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

    // 计算排行榜数据
    const leaderboard = this.calculateLeaderboard(members, wishes);
    // 计算统计数据
    const stats = this.calculateStats(wishes);

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
      },
      leaderboard,
      stats
    });
  },

  // 计算排行榜
  calculateLeaderboard(members, wishes) {
    // 统计每个成员参加的活动数、发起数、聚餐数
    const memberStats = {};

    members.forEach(member => {
      memberStats[member.id] = {
        id: member.id,
        name: member.name,
        avatar: member.avatar,
        eventsJoined: 0,    // 参加的活动数
        eventsCreated: 0,   // 发起的活动数
        diningCount: 0      // 聚餐次数（餐厅类别）
      };
    });

    wishes.forEach(wish => {
      // 统计发起者
      if (wish.creator && wish.creator.id && memberStats[wish.creator.id]) {
        memberStats[wish.creator.id].eventsCreated++;
      }

      // 统计参与者
      if (wish.claimed && wish.claimed.length > 0) {
        wish.claimed.forEach(claimer => {
          if (claimer.user && claimer.user.id && memberStats[claimer.user.id]) {
            memberStats[claimer.user.id].eventsJoined++;

            // 统计聚餐（餐厅类别）
            if (wish.category === 'restaurant') {
              memberStats[claimer.user.id].diningCount++;
            }
          }
        });
      }
    });

    const statsArray = Object.values(memberStats);

    // 找出捧场王（参加活动最多）
    const partyKing = statsArray.length > 0
      ? statsArray.reduce((max, m) => m.eventsJoined > max.eventsJoined ? m : max, statsArray[0])
      : null;

    // 找出干饭王（聚餐最多）
    const foodKing = statsArray.length > 0
      ? statsArray.reduce((max, m) => m.diningCount > max.diningCount ? m : max, statsArray[0])
      : null;

    // 找出局头（发起活动最多）
    const organizerKing = statsArray.length > 0
      ? statsArray.reduce((max, m) => m.eventsCreated > max.eventsCreated ? m : max, statsArray[0])
      : null;

    return {
      partyKing: partyKing && partyKing.eventsJoined > 0 ? partyKing : null,
      foodKing: foodKing && foodKing.diningCount > 0 ? foodKing : null,
      organizerKing: organizerKing && organizerKing.eventsCreated > 0 ? organizerKing : null
    };
  },

  // 计算统计数据
  calculateStats(wishes) {
    const now = new Date();

    // 共聚会次数 - 已完成的愿望数
    const completedWishes = wishes.filter(w => {
      if (!w.targetDate) return false;
      const targetDate = new Date(w.targetDate);
      return targetDate < now && w.status === 'active';
    });

    // 一起吃了多少道菜 - 餐厅类别已完成的活动
    const restaurantWishes = wishes.filter(w =>
      w.category === 'restaurant' && w.status === 'active'
    );

    // 足迹多少个城市 - 旅行类别已完成的活动
    const travelWishes = wishes.filter(w =>
      w.category === 'travel' && w.status === 'active'
    );

    return {
      totalGatherings: completedWishes.length,
      totalDishes: restaurantWishes.length,
      totalCities: travelWishes.length
    };
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