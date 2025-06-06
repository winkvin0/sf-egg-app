<template>
  <uv-toast ref="toast"></uv-toast>
  <view style="display: flex;flex-direction: column;justify-content: center;align-items: center">

    <view style="display: flex;justify-content: center;align-items: center;margin: 50rpx 0;gap: 10rpx">
      <uv-avatar :src="user.avatar"></uv-avatar>
      <view @click="login">{{ user.nickname }}</view>
    </view>

    <view
        style="width: 90%; border-radius: 20px;box-shadow: 0 0 30rpx rgba(0, 0, 0, 0.1); padding: 20rpx">
      <!--      <view class="list">-->
      <!--        <view style="display: flex;align-items: center">-->
      <!--          <image style="width: 50rpx;height: 50rpx;margin-right: 40rpx" src="/static/notice.svg"></image>-->
      <!--          <view class="list-title">我的消息</view>-->
      <!--        </view>-->
      <!--        <image style="width: 30rpx;height: 30rpx" src="/static/right-arrow.svg"></image>-->
      <!--      </view>-->
      <!--      <view class="list">-->
      <!--        <view style="display: flex;align-items: center">-->
      <!--          <image style="width: 50rpx;height: 50rpx;margin-right: 40rpx" src="/static/setting.svg"></image>-->
      <!--          <view class="list-title">账户设置</view>-->
      <!--        </view>-->
      <!--        <image style="width: 30rpx;height: 30rpx" src="/static/right-arrow.svg"></image>-->
      <!--      </view>-->
      <!--      <view class="list">-->
      <!--        <view style="display: flex;align-items: center">-->
      <!--          <image style="width: 50rpx;height: 50rpx;margin-right: 40rpx" src="/static/ticket.svg"></image>-->
      <!--          <view class="list-title">开票信息</view>-->
      <!--        </view>-->
      <!--        <image style="width: 30rpx;height: 30rpx" src="/static/right-arrow.svg"></image>-->
      <!--      </view>-->
      <!--      <view class="list">-->
      <!--        <view style="display: flex;align-items: center">-->
      <!--          <image style="width: 50rpx;height: 50rpx;margin-right: 40rpx" src="/static/remark.svg"></image>-->
      <!--          <view class="list-title">意见反馈</view>-->
      <!--        </view>-->
      <!--        <image style="width: 30rpx;height: 30rpx" src="/static/right-arrow.svg"></image>-->
      <!--      </view>-->
      <view class="list" @click="toPrivacy()">
        <view style="display: flex;align-items: center">
          <image style="width: 50rpx;height: 50rpx;margin-right: 40rpx" src="/static/privacy-contract.svg"></image>
          <view class="list-title">隐私协议</view>
        </view>
        <image style="width: 30rpx;height: 30rpx" src="/static/right-arrow.svg"></image>
      </view>
      <!--      <button open-type="chooseAvatar" @chooseavatar="onChooseAvatar">获取头像</button>-->
      <!--      <button open-type="getPhoneNumber" @chooseavatar="onGetPhone">获取手机</button>-->
      <!--      <input type="nickname"></input>-->
    </view>
  </view>
</template>

<script setup>
import {isSuccess, parseCookie, request} from "../../utils/httpUtils";
import {ref} from "vue";
import {baseUrl} from "../../utils/urlUtils";
import {onShow} from "@dcloudio/uni-app";

const toast = ref(null);

const user = ref({
  avatar: "/static/default-avatar.svg",
  nickname: "点击登陆",
})

onShow(async () => {
  const tmpUser = await getUserRealtime();
  if (tmpUser) {
    user.value = tmpUser
  }
})

function login() {
  if (user.value.nickname !== "点击登陆") {
    return;
  }

  toast.value.show({
    type: "loading",
    // loading: true
    message: "正在加载",
    duration: 100000
  })

  uni.login({
    provider: 'weixin',
    onlyAuthorized: true,
    success: async function (event) {
      await doLogin(event.code)
      toast.value.hide()
    },
    fail: function () {
      toast.value.show({
        type: 'error',
        message: '登陆失败'
      })
    }
  })
}

async function doLogin(code) {
  try {
    const resp = await request({
      url: baseUrl + '/auth/wx/login',
      method: 'POST',
      data: code
    });
    const cookie = parseCookie(resp.header['Set-Cookie']);
    if (!isSuccess(resp.data) || !cookie['satoken']) {
      toast.value.show({
        type: "error",
        message: '登陆失败'
      })
      return;
    }
    uni.setStorageSync('satoken', cookie['satoken']);

    const tmpUser = await getUserRealtime();
    // 未登陆则跳转，登陆了则赋值
    if (!tmpUser) {
      await uni.navigateTo({
        url: '/pages/my/link',
      })
    } else {
      user.value = tmpUser
    }
  } catch (e) {
    toast.value.show({
      type: "error",
      message: '登陆失败'
    })
  }
}

async function getUserRealtime() {
  if (!uni.getStorageSync('satoken')) {
    return;
  }
  const resp = await request({
    url: baseUrl + '/app/wx/user',
    method: 'GET',
    header: {
      'Cookie': 'satoken=' + uni.getStorageSync('satoken')
    }
  });
  if (!isSuccess(resp.data) || !resp.data.data) {
    return;
  }
  const user = resp.data.data
  if (!user.nickname) {
    user.nickname = "尊敬的盛菲用户";
  }
  return user;
}


function toPrivacy() {
  wx.openPrivacyContract({})
}
</script>

<style lang="scss" scoped>
@import "@climblee/uv-ui/theme.scss";

.list-title {
  color: $uv-main-color;
  font-size: 30rpx;
  padding: 35rpx 0;
}

.list {
  display: flex;
  justify-content: space-between;
  align-items: center
}
</style>
