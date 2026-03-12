// 灵动纪念日
const app = getApp();

Page({
  data: {
    anniversaries: [],
    fixedAnniversaries: [],
    cycleAnniversaries: [],
    activeTab: 'fixed'
  },

  onLoad() {
    this.loadAnniversaries();
  },

  onShow() {
    // 页面守卫：检查是否选择了圈子
    if (!app.globalData.currentCircleId) {
      wx.redirectTo({ url: '/pages/circle/index' });
      return;
    }
    this.loadAnniversaries();
  },

  // 加载纪念日数据 - 从当前圈子获取
  loadAnniversaries() {
    const circleData = app.getCurrentCircleData();
    const anniversaries = circleData ? circleData.anniversaries : [];
    const fixed = anniversaries.filter(a => a.type === 'fixed');
    const cycle = anniversaries.filter(a => a.type === 'cycle');

    this.setData({
      anniversaries,
      fixedAnniversaries: fixed,
      cycleAnniversaries: cycle
    });
  },

  // 切换标签
  switchTab(e) {
    const { tab } = e.currentTarget.dataset;
    this.setData({ activeTab: tab });
  },

  // 获取倒计时
  getCountdown(date) {
    if (!date) return { days: 0 };
    const now = new Date();
    const target = new Date(date);
    const thisYear = new Date(now.getFullYear(), target.getMonth(), target.getDate());

    let diff = thisYear - now;
    let year = now.getFullYear();

    // 如果已经过了今年，设置到明年
    if (diff < 0) {
      const nextYear = new Date(year + 1, target.getMonth(), target.getDate());
      diff = nextYear - now;
    }

    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return { days };
  },

  // 是否已过
  isPast(date) {
    if (!date) return false;
    const now = new Date();
    const target = new Date(date);
    const thisYear = new Date(now.getFullYear(), target.getMonth(), target.getDate());
    return thisYear < now;
  },

  // 获取星期几
  getWeekday(value) {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weekdays[value] || '';
  },

  // 切换开关
  toggleEnabled(e) {
    const { id } = e.currentTarget.dataset;
    const { checked } = e.detail;

    const anniversaries = this.data.anniversaries.map(a => {
      if (a.id === id) {
        return { ...a, enabled: checked };
      }
      return a;
    });

    // 更新当前圈子的数据
    const circleData = app.getCurrentCircleData();
    if (circleData) {
      circleData.anniversaries = anniversaries;
    }

    this.setData({ anniversaries });
    this.loadAnniversaries();

    wx.showToast({
      title: checked ? '已开启' : '已关闭',
      icon: 'success'
    });
  },

  // 跳转创建
  goToCreate() {
    wx.navigateTo({
      url: '/pages/create/index?type=anniversary'
    });
  },

  onShareAppMessage() {
    return {
      title: '聚了吗 - 灵动纪念日',
      path: '/pages/anniversary/index'
    };
  }
});