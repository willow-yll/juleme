App({
  CURRENT_CIRCLE_STORAGE_KEY: 'ju_le_ma_current_circle_id',

  globalData: {
    userInfo: null,
    hasLogin: false,
    userProfile: null,
    currentUserId: '',
    currentCircleId: null,
    currentCircle: null,
    circles: [],
    circleListData: null,
    currentCircleData: null,
    cloudReady: false,
    bootstrapped: false
  },

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
    console.log('聚了吗小程序启动');
    this.bootstrapPromise = this.bootstrap().catch((error) => {
      console.error('应用启动失败', error);
      throw error;
    });
  },

  async bootstrap() {
    this.initCloud();
    this.globalData.currentCircleId = this.getStoredCurrentCircleId();

    const result = await this.invokeCloudFunction('bootstrapUser');
    const userProfile = result && result.userProfile ? result.userProfile : null;
    const circles = Array.isArray(result && result.circles) ? result.circles : [];

    this.globalData.currentUserId = result && result.openid ? result.openid : '';
    this.globalData.userProfile = userProfile;
    this.globalData.circles = circles;
    this.globalData.bootstrapped = true;

    if (this.globalData.currentCircleId) {
      const matchedCircle = circles.find((item) => item._id === this.globalData.currentCircleId);
      if (!matchedCircle) {
        this.clearCurrentCircle();
      } else {
        this.globalData.currentCircle = matchedCircle;
      }
    }

    if (!this.globalData.currentCircleId && circles.length) {
      this.setCurrentCircle(circles[0]._id, { syncOnly: true });
    }

    if (this.globalData.currentCircleId) {
      const contentResult = await this.invokeCloudFunction('getCircleContent', {
        circleId: this.globalData.currentCircleId
      }).catch(() => null);
      const circle = contentResult && contentResult.circle ? contentResult.circle : null;
      if (circle) {
        this.globalData.currentCircle = circle;
        this.globalData.currentCircleData = {
          circle,
          members: Array.isArray(contentResult.members) ? contentResult.members : [],
          wishes: Array.isArray(contentResult.wishes) ? contentResult.wishes : [],
          anniversaries: Array.isArray(contentResult.anniversaries) ? contentResult.anniversaries : [],
          feedItems: Array.isArray(contentResult.feedItems) ? contentResult.feedItems : [],
          pets: Array.isArray(contentResult.pets) ? contentResult.pets : [],
          babies: Array.isArray(contentResult.babies) ? contentResult.babies : []
        };
      }
    }

    return {
      openid: this.globalData.currentUserId,
      userProfile: this.globalData.userProfile,
      circles: this.globalData.circles
    };
  },

  initCloud() {
    if (this.globalData.cloudReady) {
      return;
    }

    if (!wx.cloud) {
      throw new Error('当前基础库不支持云开发，请升级微信开发者工具和基础库。');
    }

    wx.cloud.init({
      env: 'cloud1-7gdommuw5f27ff59',
      traceUser: true
    });

    this.globalData.cloudReady = true;
  },

  async ensureBootstrap() {
    if (!this.bootstrapPromise) {
      this.bootstrapPromise = this.bootstrap();
    }
    return this.bootstrapPromise;
  },

  getStoredCurrentCircleId() {
    try {
      return wx.getStorageSync(this.CURRENT_CIRCLE_STORAGE_KEY) || null;
    } catch (error) {
      console.warn('读取当前圈子缓存失败', error);
      return null;
    }
  },

  persistCurrentCircleId(circleId) {
    try {
      if (circleId) {
        wx.setStorageSync(this.CURRENT_CIRCLE_STORAGE_KEY, circleId);
      } else {
        wx.removeStorageSync(this.CURRENT_CIRCLE_STORAGE_KEY);
      }
    } catch (error) {
      console.warn('保存当前圈子缓存失败', error);
    }
  },

  clearCurrentCircle() {
    this.globalData.currentCircleId = null;
    this.globalData.currentCircle = null;
    this.globalData.circleListData = null;
    this.globalData.currentCircleData = null;
    this.persistCurrentCircleId('');
  },

  async invokeCloudFunction(name, data = {}) {
    const result = await wx.cloud.callFunction({ name, data });
    return result && result.result ? result.result : null;
  },

  async callCloud(name, data = {}) {
    await this.ensureBootstrap();
    return this.invokeCloudFunction(name, data);
  },

  normalizeActionError(error, action) {
    const message = error && error.message ? String(error.message) : '';
    if (!message) {
      return error;
    }

    const rules = {
      submitJoinRequest: [
        {
          test: ['你已加入该圈子'],
          message: '你已经加入这个圈子了'
        },
        {
          test: ['已有待处理的申请，请耐心等待'],
          message: '你已经提交过申请，请等待圈主处理'
        }
      ],
      toggleWishClaim: [
        {
          test: ['已经报名过了', '已经报名过'],
          message: '你已经报名过这个活动了'
        },
        {
          test: ['你还没有报名该活动', '尚未报名'],
          message: '你还没有报名这个活动'
        },
        {
          test: ['名额已满啦', '名额已满'],
          message: '活动名额已满啦'
        }
      ]
    };

    const matchedRule = (rules[action] || []).find((rule) => rule.test.some((item) => message.includes(item)));
    if (!matchedRule) {
      return error;
    }

    const normalizedError = new Error(matchedRule.message);
    normalizedError.originalMessage = message;
    return normalizedError;
  },

  async refreshCurrentCircleData(options = {}) {
    return this.loadCurrentCircleData({
      silent: true,
      force: true,
      ...options
    });
  },

  getCurrentUserId() {
    return this.globalData.currentUserId;
  },

  hasUserProfile() {
    return !!(this.globalData.userProfile && this.globalData.userProfile.nickname);
  },

  getUserProfile() {
    return this.globalData.userProfile;
  },

  getCurrentCircleId() {
    return this.globalData.currentCircleId;
  },

  getCurrentCircle() {
    return this.globalData.currentCircle;
  },

  getCurrentCircleData() {
    return this.globalData.currentCircleData;
  },

  async refreshBootstrap() {
    const result = await this.callCloud('bootstrapUser');
    this.globalData.currentUserId = result && result.openid ? result.openid : this.globalData.currentUserId;
    this.globalData.userProfile = result && result.userProfile ? result.userProfile : null;
    this.globalData.circles = Array.isArray(result && result.circles) ? result.circles : [];
    this.globalData.circleListData = null;

    if (this.globalData.currentCircleId) {
      const currentCircle = this.globalData.circles.find((item) => item._id === this.globalData.currentCircleId);
      if (!currentCircle) {
        this.clearCurrentCircle();
      } else {
        this.globalData.currentCircle = currentCircle;
      }
    }

    if (!this.globalData.currentCircleId && this.globalData.circles.length) {
      this.setCurrentCircle(this.globalData.circles[0]._id, { syncOnly: true });
    }

    return {
      circles: this.globalData.circles,
      userProfile: this.globalData.userProfile,
      openid: this.globalData.currentUserId
    };
  },

  async loadCircleList(options = {}) {
    await this.ensureBootstrap();
    if (!options.force && this.globalData.circleListData) {
      return this.globalData.circleListData;
    }

    const result = await this.callCloud('getCircleListData');
    const circles = Array.isArray(result && result.circles) ? result.circles : [];
    this.globalData.circles = circles;
    this.globalData.circleListData = result;

    if (this.globalData.currentCircleId) {
      const currentCircle = circles.find((item) => item._id === this.globalData.currentCircleId);
      if (currentCircle) {
        this.globalData.currentCircle = currentCircle;
      }
    }

    return result;
  },

  setCurrentCircle(circleOrId, options = {}) {
    const circleId = typeof circleOrId === 'string'
      ? circleOrId
      : circleOrId && circleOrId._id
        ? circleOrId._id
        : null;

    if (!circleId) {
      this.clearCurrentCircle();
      return null;
    }

    this.globalData.currentCircleId = circleId;
    this.persistCurrentCircleId(circleId);

    const currentCircle = typeof circleOrId === 'object'
      ? circleOrId
      : (this.globalData.circles || []).find((item) => item._id === circleId) || null;

    this.globalData.currentCircle = currentCircle;
    if (!options.syncOnly) {
      this.globalData.currentCircleData = null;
    }
    return currentCircle;
  },

  async loadCurrentCircleData(options = {}) {
    await this.ensureBootstrap();
    if (!this.globalData.currentCircleId) {
      this.globalData.currentCircleData = null;
      return null;
    }

    if (!options.force && this.globalData.currentCircleData && this.globalData.currentCircleData.circle && this.globalData.currentCircleData.circle._id === this.globalData.currentCircleId) {
      return this.globalData.currentCircleData;
    }

    const result = await this.callCloud('getCircleContent', {
      circleId: this.globalData.currentCircleId
    });

    const circle = result && result.circle ? result.circle : null;
    const content = result ? {
      circle,
      members: Array.isArray(result.members) ? result.members : [],
      wishes: Array.isArray(result.wishes) ? result.wishes : [],
      anniversaries: Array.isArray(result.anniversaries) ? result.anniversaries : [],
      feedItems: Array.isArray(result.feedItems) ? result.feedItems : [],
      pets: Array.isArray(result.pets) ? result.pets : [],
      babies: Array.isArray(result.babies) ? result.babies : []
    } : null;

    if (!circle) {
      this.clearCurrentCircle();
      if (!options.silent) {
        throw new Error('圈子不存在或无权访问');
      }
      return null;
    }

    this.globalData.currentCircle = circle;
    this.globalData.currentCircleData = content;

    const circleExists = (this.globalData.circles || []).some((item) => item._id === circle._id);
    if (!circleExists) {
      this.globalData.circles = [circle].concat(this.globalData.circles || []);
    } else {
      this.globalData.circles = (this.globalData.circles || []).map((item) => item._id === circle._id ? circle : item);
    }

    return content;
  },

  async ensureCurrentCircleSelected() {
    await this.ensureBootstrap();
    if (this.globalData.currentCircleId) {
      return this.globalData.currentCircleId;
    }

    const circles = this.globalData.circles || [];
    if (circles.length) {
      this.setCurrentCircle(circles[0]._id, { syncOnly: true });
      return this.globalData.currentCircleId;
    }

    return null;
  },

  async createCircle(payload) {
    await this.ensureBootstrap();
    const result = await this.callCloud('createCircle', payload);
    await this.refreshBootstrap();
    if (result && result.circle && result.circle._id) {
      this.setCurrentCircle(result.circle._id, { syncOnly: true });
      await this.refreshCurrentCircleData();
    }
    return result;
  },

  async submitJoinRequest(payload) {
    await this.ensureBootstrap();
    try {
      return await this.callCloud('submitJoinRequest', payload);
    } catch (error) {
      throw this.normalizeActionError(error, 'submitJoinRequest');
    }
  },

  async reviewJoinRequest(payload) {
    await this.ensureBootstrap();
    const result = await this.callCloud('reviewJoinRequest', payload);
    await this.loadCircleList({ force: true });
    if (this.globalData.currentCircleId === payload.circleId) {
      await this.refreshCurrentCircleData();
    }
    return result;
  },

  async renameCurrentCircle(name) {
    await this.ensureBootstrap();
    if (!this.globalData.currentCircleId) {
      throw new Error('请先选择圈子');
    }
    const result = await this.callCloud('renameCircle', {
      circleId: this.globalData.currentCircleId,
      name
    });
    await this.loadCircleList({ force: true });
    await this.refreshCurrentCircleData();
    return result;
  },

  async createWish(payload) {
    await this.ensureBootstrap();
    if (!this.globalData.currentCircleId) {
      throw new Error('请先选择圈子');
    }
    const result = await this.callCloud('createWish', {
      circleId: this.globalData.currentCircleId,
      ...payload
    });
    await this.refreshCurrentCircleData();
    return result;
  },

  async toggleWishClaim(wishId, action) {
    await this.ensureBootstrap();
    if (!this.globalData.currentCircleId) {
      throw new Error('请先选择圈子');
    }
    try {
      const result = await this.callCloud('toggleWishClaim', {
        circleId: this.globalData.currentCircleId,
        wishId,
        action
      });
      await this.refreshCurrentCircleData();
      return result;
    } catch (error) {
      throw this.normalizeActionError(error, 'toggleWishClaim');
    }
  },

  async deleteWish(wishId) {
    await this.ensureBootstrap();
    if (!this.globalData.currentCircleId) {
      throw new Error('请先选择圈子');
    }
    const result = await this.callCloud('deleteWish', {
      circleId: this.globalData.currentCircleId,
      wishId
    });
    await this.refreshCurrentCircleData();
    return result;
  },

  async saveUserProfile(profile) {
    await this.ensureBootstrap();
    const result = await this.callCloud('saveUserProfile', profile);
    this.globalData.userProfile = result && result.userProfile ? result.userProfile : profile;
    await this.loadCircleList({ force: true });
    if (this.globalData.currentCircleId) {
      await this.refreshCurrentCircleData();
    }
    return result;
  },

  async createAnniversary(payload) {
    await this.ensureBootstrap();
    if (!this.globalData.currentCircleId) {
      throw new Error('请先选择圈子');
    }
    const result = await this.callCloud('createAnniversary', {
      circleId: this.globalData.currentCircleId,
      ...payload
    });
    await this.refreshCurrentCircleData();
    return result;
  },

  async updateAnniversaryEnabled(anniversaryId, enabled) {
    await this.ensureBootstrap();
    if (!this.globalData.currentCircleId) {
      throw new Error('请先选择圈子');
    }
    const result = await this.callCloud('updateAnniversaryEnabled', {
      circleId: this.globalData.currentCircleId,
      anniversaryId,
      enabled
    });
    await this.refreshCurrentCircleData();
    return result;
  },

  async generateCircleInterpretation(circleId) {
    await this.ensureBootstrap();
    const targetCircleId = circleId || this.globalData.currentCircleId;
    if (!targetCircleId) {
      throw new Error('请先选择圈子');
    }
    return this.callCloud('generateCircleInterpretation', { circleId: targetCircleId });
  },

  async leaveCircle(circleId) {
    await this.ensureBootstrap();
    const targetCircleId = circleId || this.globalData.currentCircleId;
    if (!targetCircleId) {
      throw new Error('请先选择圈子');
    }

    const result = await this.callCloud('leaveCircle', { circleId: targetCircleId });
    const previousCircleId = this.globalData.currentCircleId;
    const bootstrap = await this.refreshBootstrap();
    const circles = Array.isArray(bootstrap && bootstrap.circles) ? bootstrap.circles : [];

    if (!circles.length) {
      this.clearCurrentCircle();
      const emptyResult = result || {};
      emptyResult.hasCircles = false;
      emptyResult.currentCircleId = null;
      return emptyResult;
    }

    if (previousCircleId === targetCircleId || !this.globalData.currentCircleId) {
      const nextCircle = circles.find((item) => item._id !== targetCircleId) || circles[0];
      this.setCurrentCircle(nextCircle._id, { syncOnly: true });
    }

    await this.loadCircleList({ force: true });
    await this.refreshCurrentCircleData();
    const nextResult = result || {};
    nextResult.hasCircles = true;
    nextResult.currentCircleId = this.globalData.currentCircleId;
    return nextResult;
  },

  async deleteAccount() {
    await this.ensureBootstrap();
    const result = await this.callCloud('deleteAccount');
    this.globalData.userInfo = null;
    this.globalData.hasLogin = false;
    this.globalData.userProfile = null;
    this.globalData.currentUserId = '';
    this.globalData.circles = [];
    this.globalData.circleListData = null;
    this.globalData.currentCircleData = null;
    this.clearCurrentCircle();
    this.bootstrapPromise = null;
    return result;
  },

  getUserInfo() {
    return this.globalData.userInfo;
  },

  setUserInfo(userInfo) {
    this.globalData.userInfo = userInfo;
    this.globalData.hasLogin = true;
  },

  formatDate(date) {
    const d = new Date(date);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    return `${month}月${day}日`;
  },

  calculateCountdown(targetDate) {
    const now = new Date();
    const target = new Date(targetDate);
    const diff = target - now;

    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, finished: true };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return { days, hours, minutes, finished: false };
  }
});
