// 创建页面
const app = getApp();

Page({
  data: {
    type: 'wish',
    form: {
      title: '',
      description: '',
      category: 'restaurant',
      targetDate: '',
      dateUndecided: false,
      maxClaim: 5
    },
    anniversaryForm: {
      name: '',
      subType: 'fixed',
      date: '',
      weekday: null,
      remind: true
    },
    weekdays: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
    submitting: false
  },

  async onLoad(options) {
    try {
      await app.ensureBootstrap();
      const circleId = await app.ensureCurrentCircleSelected();
      if (!circleId) {
        wx.redirectTo({ url: '/pages/circle/index' });
        return;
      }
      const { type } = options;
      if (type && ['wish', 'anniversary'].includes(type)) {
        this.setData({ type });
      }
    } catch (error) {
      wx.showToast({ title: error.message || '初始化失败', icon: 'none' });
    }
  },

  switchType(e) {
    const { type } = e.currentTarget.dataset;
    this.setData({ type });
  },

  onTitleInput(e) {
    this.setData({ 'form.title': e.detail.value });
  },

  onDescInput(e) {
    this.setData({ 'form.description': e.detail.value });
  },

  selectCategory(e) {
    const { category } = e.currentTarget.dataset;
    this.setData({ 'form.category': category });
  },

  onDateChange(e) {
    this.setData({ 'form.targetDate': e.detail.value, 'form.dateUndecided': false });
  },

  onDateUndecidedChange(e) {
    const checked = e.detail.value;
    this.setData({
      'form.dateUndecided': checked,
      'form.targetDate': checked ? '' : this.data.form.targetDate
    });
  },

  onMaxClaimChange(e) {
    this.setData({ 'form.maxClaim': e.detail.value });
  },

  onAnniversaryNameInput(e) {
    this.setData({ 'anniversaryForm.name': e.detail.value });
  },

  switchAnniversaryType(e) {
    const { type } = e.currentTarget.dataset;
    this.setData({ 'anniversaryForm.subType': type });
  },

  onAnniversaryDateChange(e) {
    this.setData({ 'anniversaryForm.date': e.detail.value });
  },

  onWeekdayChange(e) {
    this.setData({ 'anniversaryForm.weekday': Number(e.detail.value) });
  },

  onRemindChange(e) {
    this.setData({ 'anniversaryForm.remind': e.detail.value });
  },

  handleSubmit() {
    if (this.data.type === 'wish') {
      this.submitWish();
      return;
    }
    this.submitAnniversary();
  },

  async submitWish() {
    const { form, submitting } = this.data;
    if (submitting) return;
    if (!form.title || !form.title.trim()) {
      wx.showToast({ title: '请输入活动标题', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    try {
      await app.createWish({
        title: form.title.trim(),
        description: (form.description || '').trim(),
        category: form.category,
        targetDate: form.dateUndecided ? '' : form.targetDate,
        maxClaim: form.maxClaim
      });
      wx.showToast({ title: '活动发布成功！', icon: 'success' });
      setTimeout(() => {
        wx.switchTab({ url: '/pages/wishlist/index' });
      }, 800);
    } catch (error) {
      this.setData({ submitting: false });
      wx.showToast({ title: error.message || '发布失败', icon: 'none' });
    }
  },

  async submitAnniversary() {
    const { anniversaryForm, submitting } = this.data;
    if (submitting) return;
    if (!anniversaryForm.name || !anniversaryForm.name.trim()) {
      wx.showToast({ title: '请输入名称', icon: 'none' });
      return;
    }

    let nextDate = '';
    let date = '';
    let cycleValue = null;
    if (anniversaryForm.subType === 'fixed') {
      if (!anniversaryForm.date) {
        wx.showToast({ title: '请选择日期', icon: 'none' });
        return;
      }
      date = anniversaryForm.date;
      nextDate = anniversaryForm.date;
    } else {
      if (anniversaryForm.weekday === null) {
        wx.showToast({ title: '请选择星期', icon: 'none' });
        return;
      }
      cycleValue = anniversaryForm.weekday;
      nextDate = this.getNextWeekday(anniversaryForm.weekday);
    }

    const icons = ['🎂', '💕', '🎉', '🍗', '🎬'];
    this.setData({ submitting: true });
    try {
      await app.createAnniversary({
        name: anniversaryForm.name.trim(),
        type: anniversaryForm.subType === 'fixed' ? 'fixed' : 'cycle',
        date,
        cycleType: 'weekly',
        cycleValue,
        nextDate,
        enabled: anniversaryForm.remind,
        icon: icons[Math.floor(Math.random() * icons.length)]
      });
      wx.showToast({ title: '纪念日设置成功！', icon: 'success' });
      setTimeout(() => {
        wx.switchTab({ url: '/pages/anniversary/index' });
      }, 800);
    } catch (error) {
      this.setData({ submitting: false });
      wx.showToast({ title: error.message || '保存失败', icon: 'none' });
    }
  },

  getNextWeekday(weekday) {
    const now = new Date();
    const currentDay = now.getDay();
    const daysToAdd = (weekday - currentDay + 7) % 7 || 7;
    now.setDate(now.getDate() + daysToAdd);
    return now.toISOString().split('T')[0];
  },

  onShareAppMessage() {
    return {
      title: '聚了吗 - 创建',
      path: '/pages/create/index'
    };
  }
});
