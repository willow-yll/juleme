// 个人资料设置页面
const app = getApp();

const DEFAULT_AVATAR = '/assets/icons/user.png';

function chooseImage(options) {
  return new Promise((resolve, reject) => {
    wx.chooseImage({
      ...options,
      success: resolve,
      fail: reject
    });
  });
}

function uploadFile(options) {
  return new Promise((resolve, reject) => {
    wx.cloud.uploadFile({
      ...options,
      success: resolve,
      fail: reject
    });
  });
}

Page({
  data: {
    nickname: '',
    gender: '',
    mbti: '',
    constellation: '',
    avatar: '',
    genderOptions: [],
    mbtiOptions: [],
    constellationOptions: [],
    genderIndex: -1,
    mbtiIndex: -1,
    constellationIndex: -1,
    avatarUploading: false,
    saving: false,
    defaultAvatar: DEFAULT_AVATAR
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
      avatar: profile.avatar || '',
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

  async chooseAvatar() {
    const { avatarUploading, saving } = this.data;
    if (avatarUploading || saving) return;

    try {
      const chooseResult = await chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      });
      const filePath = chooseResult && chooseResult.tempFilePaths && chooseResult.tempFilePaths[0];
      if (!filePath) {
        return;
      }

      this.setData({ avatarUploading: true });
      wx.showLoading({ title: '上传中...' });

      const userId = app.getCurrentUserId() || 'anonymous';
      const extensionMatch = filePath.match(/\.[^.]+$/);
      const extension = extensionMatch ? extensionMatch[0] : '.jpg';
      const cloudPath = `avatars/${userId}/${Date.now()}${extension}`;
      const uploadResult = await uploadFile({
        cloudPath,
        filePath
      });

      this.setData({
        avatar: uploadResult.fileID || '',
        avatarUploading: false
      });
      wx.hideLoading();
      wx.showToast({ title: '头像已上传', icon: 'success' });
    } catch (error) {
      this.setData({ avatarUploading: false });
      wx.hideLoading();
      if (error && error.errMsg && error.errMsg.indexOf('cancel') >= 0) {
        return;
      }
      wx.showToast({ title: error.message || '头像上传失败', icon: 'none' });
    }
  },

  async handleSave() {
    const { nickname, gender, mbti, constellation, avatar, saving, avatarUploading } = this.data;
    if (saving || avatarUploading) return;

    if (!nickname || !nickname.trim()) {
      wx.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }

    const profile = {
      nickname: nickname.trim(),
      gender,
      mbti,
      constellation,
      avatar
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
