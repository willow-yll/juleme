// 个人资料设置页面
const app = getApp();

Page({
  data: {
    nickname: '',
    gender: '',
    mbti: '',
    constellation: '',
    genderOptions: [],
    mbtiOptions: [],
    constellationOptions: [],
    genderIndex: -1,
    mbtiIndex: -1,
    constellationIndex: -1,
    saving: false
  },

  async onLoad() {
    await app.ensureBootstrap().catch(() => null);
    const genderOptions = app.GENDER_OPTIONS || [];
    const mbtiOptions = app.MBTI_OPTIONS || [];
    const constellationOptions = app.CONSTELLATION_OPTIONS || [];
    const profile = app.getUserProfile() || {};

    this.setData({
      genderOptions,
      mbtiOptions,
      constellationOptions,
      nickname: profile.nickname || '',
      gender: profile.gender || '',
      mbti: profile.mbti || '',
      constellation: profile.constellation || '',
      genderIndex: genderOptions.findIndex((item) => item.value === profile.gender),
      mbtiIndex: mbtiOptions.findIndex((item) => item.value === profile.mbti),
      constellationIndex: constellationOptions.findIndex((item) => item.value === profile.constellation)
    });
  },

  onNicknameInput(e) {
    this.setData({ nickname: e.detail.value });
  },

  onGenderChange(e) {
    const index = Number(e.detail.value);
    const item = this.data.genderOptions[index];
    this.setData({
      genderIndex: index,
      gender: item ? item.value : ''
    });
  },

  onMbtiChange(e) {
    const index = Number(e.detail.value);
    const item = this.data.mbtiOptions[index];
    this.setData({
      mbtiIndex: index,
      mbti: item ? item.value : ''
    });
  },

  onConstellationChange(e) {
    const index = Number(e.detail.value);
    const item = this.data.constellationOptions[index];
    this.setData({
      constellationIndex: index,
      constellation: item ? item.value : ''
    });
  },

  async handleSave() {
    const { nickname, gender, mbti, constellation, saving } = this.data;
    if (saving) return;

    if (!nickname || !nickname.trim()) {
      wx.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }

    const profile = {
      nickname: nickname.trim(),
      gender,
      mbti,
      constellation,
      avatar: 'https://picsum.photos/100'
    };

    this.setData({ saving: true });

    try {
      await app.saveUserProfile(profile);
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => {
        const pages = getCurrentPages();
        if (pages.length > 1) {
          wx.navigateBack();
        } else {
          if (app.getCurrentCircleId()) {
            wx.switchTab({ url: '/pages/circle/home/index' });
          } else {
            wx.redirectTo({ url: '/pages/circle/index' });
          }
        }
      }, 800);
    } catch (error) {
      this.setData({ saving: false });
      wx.showToast({ title: error.message || '保存失败', icon: 'none' });
    }
  }
});
