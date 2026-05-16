<template>
  <view class="my-page">
    <app-safe-area />

    <view class="profile-card" @click="handleProfileTap">
      <view class="profile-main">
        <image class="avatar" :src="displayUser.avatar" mode="aspectFill"></image>
        <view class="profile-copy">
          <view class="nickname">{{ displayUser.nickname }}</view>
          <view class="profile-desc">{{ profileDesc }}</view>
        </view>
      </view>
      <view class="profile-action">
        <text>{{ profileActionText }}</text>
        <image class="action-arrow" src="/static/right-arrow.svg" mode="aspectFit"></image>
      </view>
      <view class="profile-glow"></view>
    </view>

    <view class="service-card">
      <view class="section-title">服务</view>
      <view class="list disabled" @click="handleBlockedFeatureTap">
        <view class="list-left">
          <image class="list-icon" src="/static/notice.svg" mode="aspectFit"></image>
          <view>
            <view class="list-title">我的消息</view>
            <view class="list-desc">服务通知与业务提醒</view>
          </view>
        </view>
        <view class="coming">即将开放</view>
      </view>
      <view class="list disabled" @click="handleBlockedFeatureTap">
        <view class="list-left">
          <image class="list-icon" src="/static/ticket.svg" mode="aspectFit"></image>
          <view>
            <view class="list-title">开票信息</view>
            <view class="list-desc">常用抬头与联系方式</view>
          </view>
        </view>
        <view class="coming">即将开放</view>
      </view>
      <view class="list" @click="handlePrivacyTap">
        <view class="list-left">
          <image class="list-icon" src="/static/privacy-contract.svg" mode="aspectFit"></image>
          <view>
            <view class="list-title">隐私协议</view>
            <view class="list-desc">查看平台隐私保护说明</view>
          </view>
        </view>
        <image class="row-arrow" src="/static/right-arrow.svg" mode="aspectFit"></image>
      </view>
    </view>

    <view class="sf-tabbar-spacer"></view>
    <view class="sf-tabbar-wrap">
      <view class="sf-tabbar">
        <view class="sf-tabbar-item" @click="goTab('/pages/home/home')">
          <view class="sf-tabbar-icon-wrap">
            <image class="sf-tabbar-icon" src="/static/tab-home.png" mode="aspectFit"></image>
          </view>
          <text class="sf-tabbar-text">首页</text>
        </view>
        <view class="sf-tabbar-item" @click="goTab('/pages/price/price')">
          <view class="sf-tabbar-icon-wrap">
            <image class="sf-tabbar-icon" src="/static/tab-egg.png" mode="aspectFit"></image>
          </view>
          <text class="sf-tabbar-text">蛋价</text>
        </view>
        <view class="sf-tabbar-item active" @click="goTab('/pages/my/my')">
          <view class="sf-tabbar-icon-wrap">
            <image class="sf-tabbar-icon" src="/static/tab-user-active.png" mode="aspectFit"></image>
          </view>
          <text class="sf-tabbar-text">我的</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import {computed} from "vue";
import {onShow} from "@dcloudio/uni-app";
import {authState, ensureAuthProfile, hasBoundPhone, hydrateAuthProfileFromCache} from "../../utils/authUtils";
import {resolveBackendFileUrl} from "../../utils/fileUtils";
import {showNoneToast} from "../../utils/toastUtils";
import {hideSystemTabBar, switchTabIfNeeded} from "../../utils/appUtils";

const defaultUser = {
  avatar: "/static/default-avatar.svg",
  nickname: "绑定手机号",
}

const isPhoneBound = computed(() => hasBoundPhone(authState.user))
const isLoggedIn = computed(() => Boolean(authState.user) && isPhoneBound.value)
const linkRequired = computed(() => authState.tokenReady && !isPhoneBound.value && !authState.authFailed)

const displayUser = computed(() => {
  if (authState.loading) {
    return {
      ...defaultUser,
      nickname: "正在确认账号",
    };
  }
  if (authState.authFailed) {
    return {
      ...defaultUser,
      nickname: "信息获取失败",
    };
  }
  if (!isLoggedIn.value) {
    return defaultUser;
  }
  return {
    ...defaultUser,
    ...authState.user,
    nickname: authState.user.nickname || "尊敬的盛菲用户",
    avatar: resolveBackendFileUrl(authState.user.avatar) || defaultUser.avatar,
  }
})

const profileDesc = computed(() => {
  if (authState.loading) {
    return "正在确认用户信息";
  }
  if (authState.authFailed) {
    return "点击后提示无法查看和编辑我的信息";
  }
  if (isLoggedIn.value) {
    return "点击编辑用户信息";
  }
  if (linkRequired.value) {
    return "点击绑定手机号，可选填写头像昵称";
  }
  return "点击绑定手机号后使用完整服务";
})

const profileActionText = computed(() => {
  if (authState.loading) {
    return "确认中";
  }
  if (authState.authFailed) {
    return "不可用";
  }
  return isLoggedIn.value ? "编辑资料" : "绑定";
})

onShow(async () => {
  hideSystemTabBar();
  hydrateAuthProfileFromCache();
  await ensureAuthProfile();
})

function handleProfileTap() {
  if (authState.loading) {
    return;
  }
  if (authState.authFailed) {
    showUserInfoFailedToast();
    return;
  }
  if (isPhoneBound.value) {
    goEdit();
    return;
  }
  if (authState.tokenReady) {
    goLink();
    return;
  }
  ensureAuthProfile();
}

function handleBlockedFeatureTap() {
  if (authState.authFailed) {
    showUserInfoFailedToast();
  }
}

function handlePrivacyTap() {
  if (authState.authFailed) {
    showUserInfoFailedToast();
    return;
  }
  toPrivacy();
}

function goEdit() {
  uni.navigateTo({
    url: '/pages/my/edit',
  })
}

function goLink() {
  uni.navigateTo({
    url: '/pages/my/link',
  })
}

function toPrivacy() {
  wx.openPrivacyContract({})
}

function showUserInfoFailedToast() {
  showNoneToast('用户信息获取失败，无法查看和编辑我的信息')
}

function goTab(url) {
  switchTabIfNeeded(url, '/pages/my/my');
}
</script>

<style lang="scss" scoped>
@use "../../styles/custom-tabbar.scss";

.my-page {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 0 32rpx 28rpx;
  background: #f7f8f3;
  color: #18221d;
}

.profile-card {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
  min-height: 178rpx;
  padding: 30rpx 28rpx;
  overflow: hidden;
  border-radius: 32rpx;
  background: #1e6b52;
  box-shadow: 0 18rpx 40rpx rgba(30, 107, 82, 0.18);
}

.profile-main {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 22rpx;
  min-width: 0;
}

.avatar {
  flex: 0 0 auto;
  width: 108rpx;
  height: 108rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.58);
  border-radius: 50%;
  background: #f1f4ef;
}

.profile-copy {
  min-width: 0;
}

.nickname {
  max-width: 330rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 34rpx;
  line-height: 42rpx;
  font-weight: 900;
  color: #ffffff;
}

.profile-desc {
  margin-top: 8rpx;
  max-width: 360rpx;
  font-size: 24rpx;
  line-height: 34rpx;
  color: rgba(255, 255, 255, 0.78);
}

.profile-action {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 6rpx;
  flex: 0 0 auto;
  margin-left: 18rpx;
  padding: 12rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.15);
  font-size: 24rpx;
  line-height: 30rpx;
  font-weight: 800;
  color: #fff8dc;
}

.action-arrow {
  width: 22rpx;
  height: 22rpx;
  filter: brightness(0) invert(1);
}

.profile-glow {
  position: absolute;
  right: -84rpx;
  bottom: -88rpx;
  width: 250rpx;
  height: 250rpx;
  border-radius: 50%;
  background: rgba(255, 211, 92, 0.25);
}

.service-card {
  box-sizing: border-box;
  margin-top: 22rpx;
  border: 2rpx solid #e1e8df;
  border-radius: 28rpx;
  background: #ffffff;
}

.service-card {
  padding: 8rpx 24rpx;
}

.section-title {
  padding: 24rpx 0 8rpx;
  font-size: 26rpx;
  line-height: 34rpx;
  font-weight: 900;
  color: #7a6a31;
}

.list {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 116rpx;
  border-bottom: 2rpx solid #eef2ec;
}

.list:last-child {
  border-bottom: 0;
}

.list.disabled {
  opacity: 0.72;
}

.list-left {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 22rpx;
  min-width: 0;
}

.list-icon {
  width: 46rpx;
  height: 46rpx;
}

.list-title {
  color: #253025;
  font-size: 28rpx;
  line-height: 38rpx;
  font-weight: 800;
}

.list-desc {
  margin-top: 4rpx;
  font-size: 23rpx;
  line-height: 32rpx;
  color: #7a8780;
}

.coming {
  flex: 0 0 auto;
  font-size: 23rpx;
  line-height: 30rpx;
  color: #9aa49f;
}

.row-arrow {
  width: 28rpx;
  height: 28rpx;
}
</style>
