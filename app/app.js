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
      await this.loadCurrentCircleData({ silent: true });
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

  async loadCircleList() {
    await this.ensureBootstrap();
    const result = await this.callCloud('getCircleListData');
    const circles = Array.isArray(result && result.circles) ? result.circles : [];
    this.globalData.circles = circles;

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
      await this.loadCurrentCircleData({ silent: true });
    }
    return result;
  },

  async submitJoinRequest(payload) {
    await this.ensureBootstrap();
    return this.callCloud('submitJoinRequest', payload);
  },

  async reviewJoinRequest(payload) {
    await this.ensureBootstrap();
    const result = await this.callCloud('reviewJoinRequest', payload);
    await this.loadCircleList();
    if (this.globalData.currentCircleId === payload.circleId) {
      await this.loadCurrentCircleData({ silent: true });
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
    await this.loadCircleList();
    await this.loadCurrentCircleData({ silent: true });
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
    await this.loadCurrentCircleData({ silent: true });
    return result;
  },

  async toggleWishClaim(wishId, action) {
    await this.ensureBootstrap();
    if (!this.globalData.currentCircleId) {
      throw new Error('请先选择圈子');
    }
    const result = await this.callCloud('toggleWishClaim', {
      circleId: this.globalData.currentCircleId,
      wishId,
      action
    });
    await this.loadCurrentCircleData({ silent: true });
    return result;
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
    await this.loadCurrentCircleData({ silent: true });
    return result;
  },

  async saveUserProfile(profile) {
    await this.ensureBootstrap();
    const result = await this.callCloud('saveUserProfile', profile);
    this.globalData.userProfile = result && result.userProfile ? result.userProfile : profile;
    await this.loadCircleList();
    if (this.globalData.currentCircleId) {
      await this.loadCurrentCircleData({ silent: true });
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
    await this.loadCurrentCircleData({ silent: true });
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
    await this.loadCurrentCircleData({ silent: true });
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
