// 个人中心
const app = getApp();

const AVATAR_COLORS = ['#FF8A65', '#4DB6AC', '#9575CD', '#5C6BC0', '#26A69A', '#EC407A'];

function showModal(options) {
  return new Promise((resolve, reject) => {
    const modalOptions = {};
    Object.keys(options || {}).forEach((key) => {
      modalOptions[key] = options[key];
    });
    modalOptions.success = resolve;
    modalOptions.fail = reject;
    wx.showModal(modalOptions);
  });
}

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

function promptNickname(options) {
  return new Promise((resolve, reject) => {
    wx.showModal({
      ...options,
      editable: true,
      success: resolve,
      fail: reject
    });
  });
}

function showActionSheet(options) {
  return new Promise((resolve, reject) => {
    wx.showActionSheet({
      ...options,
      success: resolve,
      fail: reject
    });
  });
}

Page({
  data: {
    currentCircle: null,
    userProfile: null,
    avatarText: '我',
    avatarBgColor: AVATAR_COLORS[0],
    avatarUrl: ''
  },

  onShow() {
    this.loadProfile();
  },

  getAvatarText(nickname) {
    const text = (nickname || '我').trim();
    return text ? text[0] : '我';
  },

  getAvatarBgColor(nickname) {
    const seed = nickname || 'me';
    const hash = Array.from(seed).reduce((total, char) => total + char.charCodeAt(0), 0);
    return AVATAR_COLORS[hash % AVATAR_COLORS.length];
  },

  loadProfile() {
    const currentCircle = app.getCurrentCircle();
    const userProfile = app.getUserProfile() || {};
    const nickname = userProfile.nickname || '我';

    this.setData({
      currentCircle,
      userProfile,
      avatarText: this.getAvatarText(nickname),
      avatarBgColor: this.getAvatarBgColor(nickname),
      avatarUrl: userProfile.avatar || ''
    });
  },

  async updateProfile(patch, successMessage) {
    const currentProfile = app.getUserProfile() || {};
    const nickname = (patch.nickname !== undefined ? patch.nickname : currentProfile.nickname || '').trim();
    if (!nickname) {
      wx.showToast({ title: '请输入昵称', icon: 'none' });
      return false;
    }

    await app.saveUserProfile({
      nickname,
      gender: patch.gender !== undefined ? patch.gender : (currentProfile.gender || ''),
      mbti: patch.mbti !== undefined ? patch.mbti : (currentProfile.mbti || ''),
      constellation: patch.constellation !== undefined ? patch.constellation : (currentProfile.constellation || ''),
      avatar: patch.avatar !== undefined ? patch.avatar : (currentProfile.avatar || '')
    });
    this.loadProfile();
    wx.showToast({ title: successMessage, icon: 'success' });
    return true;
  },

  async handleAvatarTap() {
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

      wx.showLoading({ title: '上传中...' });
      const userId = app.getCurrentUserId() || 'anonymous';
      const extensionMatch = filePath.match(/\.[^.]+$/);
      const extension = extensionMatch ? extensionMatch[0] : '.jpg';
      const cloudPath = `avatars/${userId}/${Date.now()}${extension}`;
      const uploadResult = await uploadFile({ cloudPath, filePath });
      await this.updateProfile({ avatar: uploadResult.fileID || '' }, '头像已更新');
      wx.hideLoading();
    } catch (error) {
      wx.hideLoading();
      if (error && error.errMsg && error.errMsg.indexOf('cancel') >= 0) {
        return;
      }
      wx.showToast({ title: error.message || '头像更新失败', icon: 'none' });
    }
  },

  async handleNicknameTap() {
    const currentProfile = app.getUserProfile() || {};
    try {
      const result = await promptNickname({
        title: '修改昵称',
        placeholderText: '请输入昵称',
        content: currentProfile.nickname || ''
      });
      if (!result.confirm) {
        return;
      }
      const nickname = String((result.content || '')).trim();
      if (!nickname) {
        wx.showToast({ title: '请输入昵称', icon: 'none' });
        return;
      }
      await this.updateProfile({ nickname }, '昵称已更新');
    } catch (error) {
      wx.showToast({ title: error.message || '昵称更新失败', icon: 'none' });
    }
  },

  async handleLeaveCircle() {
    const listResult = await app.loadCircleList({ force: true }).catch(() => null);
    const circles = Array.isArray(listResult && listResult.circles)
      ? listResult.circles.filter((item) => item && item._id)
      : (app.globalData.circles || []).filter((item) => item && item._id);
    if (!circles.length) {
      wx.showToast({ title: '当前没有可退出的圈子', icon: 'none' });
      return;
    }

    try {
      const action = await showActionSheet({
        itemList: circles.map((item) => item.name || '未命名圈子')
      });
      const targetCircle = circles[action.tapIndex];
      if (!targetCircle) {
        return;
      }

      const confirm = await showModal({
        title: '退出圈子',
        content: `确认退出「${targetCircle.name}」吗？退出后你在该圈的活动报名会被取消。`,
        confirmColor: '#D4380D'
      });
      if (!confirm.confirm) {
        return;
      }

      wx.showLoading({ title: '退出中...' });
      const result = await app.leaveCircle(targetCircle._id);
      wx.hideLoading();
      wx.showToast({ title: '已退出圈子', icon: 'success' });
      const targetUrl = result && result.hasCircles ? '/pages/circle/home/index' : '/pages/circle/index';
      wx.reLaunch({ url: targetUrl });
    } catch (error) {
      wx.hideLoading();
      if (error && error.errMsg && error.errMsg.indexOf('cancel') >= 0) {
        return;
      }
      wx.showToast({ title: error.message || '退出失败', icon: 'none' });
    }
  },

  async handleDeleteAccount() {
    const firstConfirm = await showModal({
      title: '注销账号',
      content: '注销后将清空当前账号资料，并以匿名方式保留历史内容。该操作不可恢复。',
      confirmColor: '#D4380D'
    });
    if (!firstConfirm.confirm) {
      return;
    }

    const secondConfirm = await showModal({
      title: '再次确认注销',
      content: '请再次确认：注销后无法撤销。若你仍是任一圈子的圈主，将无法注销。',
      confirmText: '确认注销',
      confirmColor: '#D4380D'
    });
    if (!secondConfirm.confirm) {
      return;
    }

    wx.showLoading({ title: '注销中...' });
    try {
      await app.deleteAccount();
      wx.hideLoading();
      wx.showToast({ title: '已注销', icon: 'success' });
      wx.reLaunch({ url: '/pages/profile/setup/index' });
    } catch (error) {
      wx.hideLoading();
      wx.showToast({ title: error.message || '注销失败', icon: 'none' });
    }
  },

  // 跳转年度报告
  goToCapsule() {
    wx.navigateTo({
      url: '/pages/capsule/index'
    });
  },

  // 跳转资料设置
  goToProfileSetup() {
    wx.navigateTo({
      url: '/pages/profile/setup/index'
    });
  },

  // 跳转纪念日
  goToAnniversary() {
    wx.switchTab({
      url: '/pages/anniversary/index'
    });
  },

  // 跳转圈子
  goToCircles() {
    wx.navigateTo({
      url: '/pages/circle/index'
    });
  },

  // 跳转关于
  goToAbout() {
    wx.navigateTo({
      url: '/pages/profile/about/index'
    });
  },

  onShareAppMessage() {
    return {
      title: '聚了吗 - 我的',
      path: '/pages/profile/index'
    };
  }
});