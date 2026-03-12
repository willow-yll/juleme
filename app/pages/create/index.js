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
    weekdays: ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  },

  onLoad(options) {
    // 页面守卫：检查是否选择了圈子
    if (!app.globalData.currentCircleId) {
      wx.redirectTo({ url: '/pages/circle/index' });
      return;
    }

    const { type } = options;
    if (type && ['wish', 'anniversary'].includes(type)) {
      this.setData({ type });
    }
  },

  // 切换类型
  switchType(e) {
    const { type } = e.currentTarget.dataset;
    this.setData({ type });
  },

  // 愿望表单输入
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
    this.setData({
      'form.targetDate': e.detail.value,
      'form.dateUndecided': false
    });
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

  // 纪念日表单
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
    this.setData({ 'anniversaryForm.weekday': e.detail.value });
  },

  onRemindChange(e) {
    this.setData({ 'anniversaryForm.remind': e.detail.value });
  },

  // 提交
  handleSubmit() {
    const { type } = this.data;

    switch (type) {
      case 'wish':
        this.submitWish();
        break;
      case 'anniversary':
        this.submitAnniversary();
        break;
    }
  },

  // 提交愿望 - 写入当前圈子
  submitWish() {
    const { form } = this.data;
    const userProfile = app.getUserProfile() || {};
    const creatorName = userProfile.nickname || '我';

    if (!form.title) {
      wx.showToast({ title: '请输入活动标题', icon: 'none' });
      return;
    }

    const categoryMap = {
      restaurant: '餐厅',
      travel: '旅行',
      sport: '运动',
      entertainment: '娱乐',
      other: '其他'
    };

    const newWish = {
      id: Date.now(),
      title: form.title,
      description: form.description,
      category: form.category,
      categoryText: categoryMap[form.category],
      creator: { id: 'me', avatar: 'https://picsum.photos/100', name: creatorName },
      targetDate: form.dateUndecided ? '' : form.targetDate,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'active',
      claimed: [],
      maxClaim: form.maxClaim,
      likes: 0
    };

    // 写入当前圈子
    app.addWishToCurrentCircle(newWish);

    // 添加动态到当前圈子
    app.addFeedItemToCurrentCircle({
      id: Date.now(),
      user: { avatar: 'https://picsum.photos/100', name: creatorName },
      type: 'wish',
      content: '发起了新活动',
      title: form.title,
      time: '刚刚',
      likes: 0,
      comments: []
    });

    wx.showToast({ title: '活动发布成功！', icon: 'success' });

    setTimeout(() => {
      wx.switchTab({ url: '/pages/wishlist/index' });
    }, 1500);
  },

  // 提交纪念日 - 写入当前圈子
  submitAnniversary() {
    const { anniversaryForm } = this.data;

    if (!anniversaryForm.name) {
      wx.showToast({ title: '请输入名称', icon: 'none' });
      return;
    }

    let nextDate = '';
    if (anniversaryForm.subType === 'fixed') {
      if (!anniversaryForm.date) {
        wx.showToast({ title: '请选择日期', icon: 'none' });
        return;
      }
      nextDate = anniversaryForm.date;
    } else {
      if (anniversaryForm.weekday === null) {
        wx.showToast({ title: '请选择星期', icon: 'none' });
        return;
      }
      nextDate = this.getNextWeekday(anniversaryForm.weekday);
    }

    const icons = ['🎂', '💕', '🎉', '🍗', '🎬'];
    const newAnniversary = {
      id: Date.now(),
      name: anniversaryForm.name,
      type: anniversaryForm.subType === 'fixed' ? 'fixed' : 'cycle',
      date: anniversaryForm.date,
      cycleType: 'weekly',
      cycleValue: anniversaryForm.weekday,
      nextDate: nextDate,
      enabled: anniversaryForm.remind,
      icon: icons[Math.floor(Math.random() * icons.length)]
    };

    // 写入当前圈子
    app.addAnniversaryToCurrentCircle(newAnniversary);

    // 添加动态到当前圈子
    app.addFeedItemToCurrentCircle({
      id: Date.now(),
      user: { avatar: 'https://picsum.photos/100', name: '我' },
      type: 'anniversary',
      content: '设置了新纪念日',
      title: anniversaryForm.name,
      time: '刚刚',
      likes: 0,
      comments: []
    });

    wx.showToast({ title: '纪念日设置成功！', icon: 'success' });

    setTimeout(() => {
      wx.switchTab({ url: '/pages/anniversary/index' });
    }, 1500);
  },

  // 获取下个周几的日期
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