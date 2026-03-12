App({
  // 全局数据
  globalData: {
    userInfo: null,
    hasLogin: false,
    // 用户个人资料
    userProfile: null,
    // 圈子相关
    circles: [],
    currentCircleId: null,
    currentCircle: null,
    // 按圈子存储的数据
    circleData: {}
  },

  // 性别选项（最全分类）
  GENDER_OPTIONS: [
    { value: 'male', label: '男' },
    { value: 'female', label: '女' },
    { value: 'transgender_male', label: '跨性别男性' },
    { value: 'transgender_female', label: '跨性别女性' },
    { value: 'non_binary', label: '非二元性别' },
    { value: 'gender_fluid', label: '性别流动' },
    { value: 'agender', label: '无性别' },
    { value: 'other', label: '其他' },
    { value: 'prefer_not_to_say', label: '不愿透露' }
  ],

  // MBTI 选项
  MBTI_OPTIONS: [
    { value: 'INTJ', label: 'INTJ - 建筑师' },
    { value: 'INTP', label: 'INTP - 逻辑学家' },
    { value: 'ENTJ', label: 'ENTJ - 指挥官' },
    { value: 'ENTP', label: 'ENTP - 辩论家' },
    { value: 'INFJ', label: 'INFJ - 提倡者' },
    { value: 'INFP', label: 'INFP - 调停者' },
    { value: 'ENFJ', label: 'ENFJ - 主人公' },
    { value: 'ENFP', label: 'ENFP - 竞选者' },
    { value: 'ISTJ', label: 'ISTJ - 物流师' },
    { value: 'ISFJ', label: 'ISFJ - 守卫者' },
    { value: 'ESTJ', label: 'ESTJ - 总经理' },
    { value: 'ESFJ', label: 'ESFJ - 执政官' },
    { value: 'ISTP', label: 'ISTP - 鉴赏家' },
    { value: 'ISFP', label: 'ISFP - 探险家' },
    { value: 'ESTP', label: 'ESTP - 企业家' },
    { value: 'ESFP', label: 'ESFP - 表演者' }
  ],

  // 星座选项
  CONSTELLATION_OPTIONS: [
    { value: 'aries', label: '白羊座 (3.21-4.19)' },
    { value: 'taurus', label: '金牛座 (4.20-5.20)' },
    { value: 'gemini', label: '双子座 (5.21-6.21)' },
    { value: 'cancer', label: '巨蟹座 (6.22-7.22)' },
    { value: 'leo', label: '狮子座 (7.23-8.22)' },
    { value: 'virgo', label: '处女座 (8.23-9.22)' },
    { value: 'libra', label: '天秤座 (9.23-10.23)' },
    { value: 'scorpio', label: '天蝎座 (10.24-11.22)' },
    { value: 'sagittarius', label: '射手座 (11.23-12.21)' },
    { value: 'capricorn', label: '摩羯座 (12.22-1.19)' },
    { value: 'aquarius', label: '水瓶座 (1.20-2.18)' },
    { value: 'pisces', label: '双鱼座 (2.19-3.20)' }
  ],

  onLaunch() {
    // 小程序启动
    console.log('聚了吗小程序启动');
    this.initData();
    console.log('数据初始化完成, circles:', this.globalData.circles.length);
  },

  // 初始化示例数据
  initData() {
    // 创建默认圈子，将示例数据放入该圈子
    const defaultCircleId = 1;
    const defaultCircle = {
      id: defaultCircleId,
      name: '我的第一个圈子',
      description: '欢迎来到聚了吗！这是您的专属圈子',
      color: '#1890ff',
      code: this.generateJoinCode(),
      ownerId: 'me',
      members: [
        { id: 'me', avatar: 'https://picsum.photos/100', name: '我', role: 'owner' }
      ],
      memberCount: 1,
      joinRequests: [],
      createdAt: new Date().toISOString()
    };

    // 示例动态数据
    const feedItems = [
      {
        id: 1,
        user: { avatar: 'https://picsum.photos/100', name: '小明' },
        type: 'wish',
        content: '发起了新愿望',
        title: '去重庆吃火锅',
        time: '2小时前',
        likes: 5,
        comments: []
      },
      {
        id: 2,
        user: { avatar: 'https://picsum.photos/102', name: '阿强' },
        type: 'anniversary',
        content: '设置了新纪念日',
        title: '疯狂星期四',
        time: '5小时前',
        likes: 3,
        comments: []
      }
    ];

    // 示例愿望数据
    const wishes = [
      {
        id: 1,
        title: '去重庆吃火锅',
        description: '想吃正宗的九宫格火锅！',
        category: 'restaurant',
        categoryText: '餐厅',
        creator: { id: 'u_xiaoming', avatar: 'https://picsum.photos/100', name: '小明' },
        targetDate: '2026-04-15',
        createdAt: '2026-03-01',
        status: 'active',
        claimed: [
          { user: { id: 'u_xiaohong', avatar: 'https://picsum.photos/101', name: '小红' }, wantGo: true },
          { user: { id: 'u_aqiang', avatar: 'https://picsum.photos/102', name: '阿强' }, wantGo: true }
        ],
        maxClaim: 5,
        likes: 8
      },
      {
        id: 2,
        title: '去西藏旅行',
        description: '想看布达拉宫和纳木错',
        category: 'travel',
        categoryText: '旅行',
        creator: { id: 'u_xiaohua', avatar: 'https://picsum.photos/103', name: '小华' },
        targetDate: '2026-07-01',
        createdAt: '2026-02-15',
        status: 'active',
        claimed: [
          { user: { id: 'u_xiaoli', avatar: 'https://picsum.photos/104', name: '小丽' }, wantGo: true }
        ],
        maxClaim: 4,
        likes: 15
      },
      {
        id: 3,
        title: '打羽毛球',
        description: '周末一起去运动吧！',
        category: 'sport',
        categoryText: '运动',
        creator: { id: 'u_aqiang', avatar: 'https://picsum.photos/105', name: '阿强' },
        targetDate: '2026-03-20',
        createdAt: '2026-03-05',
        status: 'active',
        claimed: [],
        maxClaim: 4,
        likes: 3
      },
      {
        id: 4,
        title: '看一场演唱会',
        description: '想去看周杰伦的演唱会',
        category: 'other',
        categoryText: '其他',
        creator: { id: 'u_xiaomei', avatar: 'https://picsum.photos/106', name: '小美' },
        targetDate: '2026-06-01',
        createdAt: '2026-01-20',
        status: 'active',
        claimed: [
          { user: { id: 'u_xiaoming', avatar: 'https://picsum.photos/107', name: '小明' }, wantGo: true },
          { user: { id: 'u_xiaohong', avatar: 'https://picsum.photos/108', name: '小红' }, wantGo: true },
          { user: { id: 'u_aqiang', avatar: 'https://picsum.photos/109', name: '阿强' }, wantGo: true }
        ],
        maxClaim: 5,
        likes: 22
      }
    ];

    // 示例纪念日数据
    const anniversaries = [
      {
        id: 1,
        name: '疯狂星期四',
        type: 'cycle',
        cycleType: 'weekly',
        cycleValue: 4,
        nextDate: '2026-03-12',
        enabled: true,
        icon: '🍗'
      },
      {
        id: 2,
        name: '周五电影夜',
        type: 'cycle',
        cycleType: 'weekly',
        cycleValue: 5,
        nextDate: '2026-03-13',
        enabled: true,
        icon: '🎬'
      },
      {
        id: 3,
        name: '小红生日',
        type: 'fixed',
        date: '2026-04-20',
        isLunar: false,
        countdown: null
      },
      {
        id: 4,
        name: '交往纪念日',
        type: 'fixed',
        date: '2025-08-15',
        isLunar: false,
        countdown: null
      }
    ];

    // 将所有数据放入默认圈子的 circleData 中
    this.globalData.circleData[defaultCircleId] = {
      feedItems,
      wishes,
      anniversaries
    };

    // 添加默认圈子到 circles 列表
    this.globalData.circles.push(defaultCircle);

    // 设置当前圈子
    this.globalData.currentCircleId = defaultCircleId;
    this.globalData.currentCircle = defaultCircle;
  },

  // 生成6位圈子号码
  generateJoinCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  // 确保圈子数据容器存在
  ensureCircleData(circleId) {
    if (!this.globalData.circleData[circleId]) {
      this.globalData.circleData[circleId] = {
        feedItems: [],
        wishes: [],
        anniversaries: []
      };
    }
    return this.globalData.circleData[circleId];
  },

  // 获取当前圈子的数据
  getCurrentCircleData() {
    if (!this.globalData.currentCircleId) {
      return null;
    }
    return this.globalData.circleData[this.globalData.currentCircleId] || null;
  },

  // 设置当前圈子
  setCurrentCircle(circle) {
    this.globalData.currentCircleId = circle.id;
    this.globalData.currentCircle = circle;
    // 确保该圈子的数据容器存在
    this.ensureCircleData(circle.id);
  },

  // 添加动态到当前圈子
  addFeedItemToCurrentCircle(item) {
    if (!this.globalData.currentCircleId) {
      console.warn('No current circle selected');
      return false;
    }
    const circleData = this.ensureCircleData(this.globalData.currentCircleId);
    circleData.feedItems.unshift(item);
    return true;
  },

  // 添加愿望到当前圈子
  addWishToCurrentCircle(wish) {
    if (!this.globalData.currentCircleId) {
      console.warn('No current circle selected');
      return false;
    }
    const circleData = this.ensureCircleData(this.globalData.currentCircleId);
    circleData.wishes.unshift(wish);
    return true;
  },

  // 添加纪念日到当前圈子
  addAnniversaryToCurrentCircle(anniversary) {
    if (!this.globalData.currentCircleId) {
      console.warn('No current circle selected');
      return false;
    }
    const circleData = this.ensureCircleData(this.globalData.currentCircleId);
    circleData.anniversaries.unshift(anniversary);
    return true;
  },

  // 删除当前圈子的活动
  removeWishFromCurrentCircle(wishId) {
    if (!this.globalData.currentCircleId) {
      console.warn('No current circle selected');
      return false;
    }
    const circleData = this.ensureCircleData(this.globalData.currentCircleId);
    const wishIndex = circleData.wishes.findIndex(w => w.id === wishId);
    if (wishIndex === -1) {
      return false;
    }
    circleData.wishes.splice(wishIndex, 1);
    return true;
  },

  // 通过圈子号码查找圈子
  findCircleByCode(code) {
    return this.globalData.circles.find(c => c.code === code);
  },

  // 通过圈子ID查找圈子
  findCircleById(id) {
    return this.globalData.circles.find(c => c.id === id);
  },

  // 检查当前用户是否已经是圈子成员
  isCircleMember(circleId) {
    const circle = this.findCircleById(circleId);
    if (!circle || !circle.members) return false;
    return circle.members.some(m => m.id === 'me');
  },

  // 检查当前用户是否已经有待处理的加入申请
  hasPendingRequest(circleId) {
    const circle = this.findCircleById(circleId);
    if (!circle || !circle.joinRequests) return false;
    return circle.joinRequests.some(r => r.userId === 'me' && r.status === 'pending');
  },

  // 检查用户是否已完善个人资料
  hasUserProfile() {
    return this.globalData.userProfile && this.globalData.userProfile.nickname;
  },

  // 设置用户资料
  setUserProfile(profile) {
    this.globalData.userProfile = profile;
  },

  // 获取用户资料
  getUserProfile() {
    return this.globalData.userProfile;
  },

  // 更新当前用户在圈子成员中的资料
  updateMemberProfile(circleId, profile) {
    const circle = this.findCircleById(circleId);
    if (circle && circle.members) {
      const member = circle.members.find(m => m.id === 'me');
      if (member) {
        Object.assign(member, profile);
      }
    }
  },

  // 获取用户信息
  getUserInfo() {
    return this.globalData.userInfo;
  },

  // 设置用户信息
  setUserInfo(userInfo) {
    this.globalData.userInfo = userInfo;
    this.globalData.hasLogin = true;
  },

  // 格式化日期
  formatDate(date) {
    const d = new Date(date);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    return `${month}月${day}日`;
  },

  // 计算倒计时
  calculateCountdown(targetDate) {
    const now = new Date();
    const target = new Date(targetDate);
    const diff = target - now;

    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, finished: true };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return { days, hours, minutes, finished: false };
  },

  // 添加动态（兼容旧接口）
  addFeedItem(item) {
    return this.addFeedItemToCurrentCircle(item);
  }
});