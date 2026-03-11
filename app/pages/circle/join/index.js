// 加入圈子页面
Page({
  data: {
    code: ''
  },

  onCodeInput(e) {
    this.setData({ code: e.detail.value });
  },

  handleJoin() {
    const { code } = this.data;

    if (!code || code.length !== 6) {
      wx.showToast({ title: '请输入6位圈子号码', icon: 'none' });
      return;
    }

    const app = getApp();
    const circles = app.globalData.circles || [];

    // 查找圈子
    const circle = circles.find(c => c.code === code);

    if (circle) {
      // 直接加入（简化版，实际应让圈主确认）
      const newCircle = {
        ...circle,
        role: 'member'
      };

      // 检查是否已加入
      const alreadyJoined = circles.some(c => c.code === code && c.role !== 'owner');
      if (alreadyJoined) {
        wx.showToast({ title: '你已加入该圈子', icon: 'none' });
        return;
      }

      circles.push(newCircle);
      app.globalData.circles = circles;
      app.globalData.currentCircleId = newCircle.id;
      app.globalData.currentCircle = newCircle;

      wx.showToast({ title: '加入成功！', icon: 'success' });

      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' });
      }, 1500);
    } else {
      // 圈子不存在，模拟申请加入
      wx.showModal({
        title: '申请已提交',
        content: '圈子号码不存在，已向圈主发送加入申请',
        showCancel: false,
        success: () => {
          wx.navigateBack();
        }
      });
    }
  }
});