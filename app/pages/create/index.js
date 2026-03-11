// 创建页面
const app = getApp();

Page({
  data: {
    type: 'wish',
    showPetForm: false,
    form: {
      title: '',
      description: '',
      category: 'restaurant',
      targetDate: '',
      maxClaim: 5
    },
    petForm: {
      name: '',
      breed: ''
    },
    momentForm: {
      content: '',
      image: ''
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
    const { type, subType } = options;
    if (type) {
      this.setData({ type });
      if (type === 'moment' && subType) {
        this.setData({ showPetForm: subType === 'pet' });
      }
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
    this.setData({ 'form.targetDate': e.detail.value });
  },

  onMaxClaimChange(e) {
    this.setData({ 'form.maxClaim': e.detail.value });
  },

  // 宠物表单输入
  onPetNameInput(e) {
    this.setData({ 'petForm.name': e.detail.value });
  },

  onBreedInput(e) {
    this.setData({ 'petForm.breed': e.detail.value });
  },

  onMomentContentInput(e) {
    this.setData({ 'momentForm.content': e.detail.value });
  },

  // 选择图片
  chooseImage() {
    wx.chooseImage({
      count: 1,
      success: (res) => {
        this.setData({ 'momentForm.image': res.tempFilePaths[0] });
      }
    });
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
      case 'moment':
        this.submitMoment();
        break;
      case 'anniversary':
        this.submitAnniversary();
        break;
    }
  },

  // 提交愿望
  submitWish() {
    const { form } = this.data;

    if (!form.title) {
      wx.showToast({ title: '请输入愿望标题', icon: 'none' });
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
      creator: { avatar: 'https://picsum.photos/100', name: '我' },
      targetDate: form.targetDate,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'active',
      claimed: [],
      maxClaim: form.maxClaim,
      likes: 0
    };

    app.globalData.wishes.unshift(newWish);

    // 添加动态
    app.globalData.feedItems.unshift({
      id: Date.now(),
      user: { avatar: 'https://picsum.photos/100', name: '我' },
      type: 'wish',
      content: '发起了新愿望',
      title: form.title,
      time: '刚刚',
      likes: 0,
      comments: []
    });

    wx.showToast({ title: '愿望发布成功！', icon: 'success' });

    setTimeout(() => {
      wx.switchTab({ url: '/pages/wishlist/index' });
    }, 1500);
  },

  // 提交萌宠
  submitMoment() {
    const { momentForm, petForm, showPetForm, type } = this.data;

    if (!momentForm.content && !momentForm.image) {
      wx.showToast({ title: '请输入内容或上传图片', icon: 'none' });
      return;
    }

    // 如果是新增宠物
    if (showPetForm && petForm.name) {
      const newPet = {
        id: Date.now(),
        name: petForm.name,
        avatar: momentForm.image || 'https://picsum.photos/200',
        breed: petForm.breed,
        personality: ['可爱'],
        milestones: [],
        cans: 0,
        hearts: 0,
        badges: [],
        moments: []
      };
      app.globalData.pets.unshift(newPet);
    }

    // 添加瞬间
    const momentItem = {
      id: Date.now(),
      image: momentForm.image,
      content: momentForm.content,
      createdAt: new Date().toISOString().split('T')[0],
      cans: 0,
      hearts: 0
    };

    // 更新第一个宠物或宝宝
    if (app.globalData.pets.length > 0) {
      const pet = app.globalData.pets[0];
      pet.moments = [momentItem, ...(pet.moments || [])];
      pet.cans = (pet.cans || 0) + 1;
    }

    // 添��动态
    app.globalData.feedItems.unshift({
      id: Date.now(),
      user: { avatar: 'https://picsum.photos/100', name: '我' },
      type: 'moment',
      content: '晒出了可爱瞬间',
      title: momentForm.content,
      image: momentForm.image,
      time: '刚刚',
      likes: 0,
      comments: []
    });

    wx.showToast({ title: '发布成功！', icon: 'success' });

    setTimeout(() => {
      wx.switchTab({ url: '/pages/moment/index' });
    }, 1500);
  },

  // 提交纪念日
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

    app.globalData.anniversaries.unshift(newAnniversary);

    // 添加动态
    app.globalData.feedItems.unshift({
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