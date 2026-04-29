<template>
  <view class="link-page">
    <app-safe-area back />

    <view class="hero-card">
      <image class="link-logo" src="/static/app-logo-3.png" mode="aspectFit"></image>
      <view class="hero-copy">
        <view class="link-title">完成账号绑定</view>
        <view class="link-subtitle">授权手机号后，我们可以为你提供报价咨询、合作跟进等服务。</view>
      </view>
    </view>

    <view class="steps-card">
      <view class="step-item done">
        <view class="step-dot">1</view>
        <view>
          <view class="step-title">微信账号登录</view>
          <view class="step-desc">已完成基础身份确认</view>
        </view>
      </view>
      <view class="step-item">
        <view class="step-dot">2</view>
        <view>
          <view class="step-title">绑定手机号</view>
          <view class="step-desc">用于账号安全与服务联系</view>
        </view>
      </view>
    </view>

    <view class="profile-card">
      <view class="profile-card-head">
        <view>
          <view class="profile-title">头像与昵称</view>
          <view class="profile-desc">手机号必填，头像和昵称可以稍后再完善。</view>
        </view>
      </view>
      <button class="avatar-row" :loading="avatarUploading" :disabled="avatarUploading" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
        <image class="profile-avatar" :src="avatarPreview" mode="aspectFill"></image>
        <view class="avatar-copy">
          <view class="nickname-label">头像</view>
          <view class="avatar-desc">{{ avatarDesc }}</view>
        </view>
        <image class="row-arrow" src="/static/right-arrow.svg" mode="aspectFit"></image>
      </button>
      <view class="nickname-row">
        <view class="nickname-label">昵称</view>
        <input
          class="nickname-input"
          type="nickname"
          maxlength="20"
          placeholder="选填，可使用微信昵称"
          placeholder-class="nickname-placeholder"
          v-model="nickname"
        />
      </view>
    </view>

    <view class="agreement-card" @click="toggleAgreement">
      <checkbox-group @click.stop @change="onAgreementChange">
        <checkbox value="agree" :checked="agreed"></checkbox>
      </checkbox-group>
      <view class="agreement-text">
        我已阅读并同意
        <text class="privacy-link" @click.stop="toPrivacy">《用户隐私协议》</text>
      </view>
    </view>

    <button v-if="!canRequestPhone" class="login-button muted" @click="openTips">{{ bindButtonText }}</button>
    <button v-else class="login-button" open-type="getPhoneNumber" @getphonenumber="onGetPhoneNumber">
      手机号快捷登录
    </button>
  </view>
</template>

<script setup>

import {computed, ref} from "vue";
import {onShow} from "@dcloudio/uni-app";
import {isSuccess, parseCookie, request} from "../../utils/httpUtils";
import {baseUrl} from "../../utils/urlUtils";
import {authState, ensureAuthProfile, getSatoken, setGlobalUserProfile} from "../../utils/authUtils";
import {resolveBackendFileUrl, uploadImage} from "../../utils/fileUtils";
import {showNoneToast} from "../../utils/toastUtils";

const agreed = ref(false)
const defaultAvatar = "/static/default-avatar.svg";
const avatar = ref(defaultAvatar)
const nickname = ref('')
const tokenReady = ref(false)
const avatarUploading = ref(false)

const canRequestPhone = computed(() => {
  return tokenReady.value && agreed.value && !avatarUploading.value;
})

const avatarPreview = computed(() => {
  return resolveBackendFileUrl(avatar.value) || defaultAvatar;
})

const avatarDesc = computed(() => {
  return avatarUploading.value ? "头像上传中" : "点击选择微信头像";
})

const bindButtonText = computed(() => {
  if (!tokenReady.value) {
    return "微信登录未完成";
  }
  return "手机号快捷登录";
})

onShow(async () => {
  await ensureAuthProfile();
  tokenReady.value = authState.tokenReady;
})

function toPrivacy() {
  wx.openPrivacyContract({})
}

async function openTips() {
  if (!tokenReady.value) {
    showNoneToast("用户信息获取失败，无法查看和编辑我的信息")
    return;
  }
  showNoneToast("请先阅读并同意用户隐私协议")
}

async function onGetPhoneNumber(e) {
  const satoken = getSatoken();
  if (!satoken) {
    tokenReady.value = false;
    showNoneToast("用户信息获取失败，无法查看和编辑我的信息")
    return;
  }
  const phoneCode = e?.detail?.code;
  if (!phoneCode) {
    showNoneToast("手机绑定失败")
    return;
  }
  const profile = buildProfileDraft();

  uni.showLoading({
    title: '正在加载',
    mask: true
  })
  try {
    const resp = await request({
      url: baseUrl + '/wx/auth/link',
      method: 'POST',
      data: {
        code: phoneCode,
      },
      header: {
        'Cookie': 'satoken=' + satoken
      }
    });
    // 如果关联成功且后端下发新 token，则替换本地 token；未下发时继续使用原 token。
    const cookie = parseCookie(resp.header['Set-Cookie']) || {};
    if (!isSuccess(resp.data)) {
      uni.hideLoading()
      showNoneToast('手机绑定失败')
      return;
    }
    if (cookie['satoken']) {
      uni.setStorageSync('satoken', cookie['satoken']);
    }
    uni.setStorageSync('sf_user_profile_draft', profile);
    if (hasProfileDraft(profile)) {
      await syncProfile(profile);
    }
    await ensureAuthProfile({refresh: true});
    if (!authState.user && hasProfileDraft(profile)) {
      setGlobalUserProfile({
        ...profile,
      });
    }
    await uni.switchTab({
      url: `/pages/my/my`
    })
  } catch (error) {
    showNoneToast('手机绑定失败')
  } finally {
    uni.hideLoading()
  }
}

function onAgreementChange(event) {
  agreed.value = event.detail.value.includes('agree');
}

function toggleAgreement() {
  agreed.value = !agreed.value;
}

async function onChooseAvatar(event) {
  const avatarUrl = event.detail.avatarUrl;
  if (!avatarUrl) {
    return;
  }
  avatarUploading.value = true;
  try {
    const uploaded = await uploadImage(avatarUrl);
    avatar.value = resolveBackendFileUrl(uploaded.url);
  } catch (e) {
    showNoneToast('头像上传失败')
  } finally {
    avatarUploading.value = false;
  }
}

function buildProfileDraft() {
  const profile = {};
  const value = nickname.value.trim();
  if (avatar.value && avatar.value !== defaultAvatar) {
    profile.avatar = avatar.value;
  }
  if (value) {
    profile.nickname = value;
  }
  return profile;
}

async function syncProfile(profile) {
  try {
    const resp = await request({
      url: baseUrl + '/app/user',
      method: 'PUT',
      data: profile,
      header: {
        'Cookie': 'satoken=' + uni.getStorageSync('satoken')
      }
    });
    if (!isSuccess(resp.data)) {
      return;
    }
  } catch (e) {
    // 本地草稿已保存，接口不可用时不阻断手机号绑定流程。
  }
}

function hasProfileDraft(profile) {
  return Boolean(profile.avatar || profile.nickname);
}

</script>


<style scoped lang="scss">
.link-page {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 0 32rpx 56rpx;
  background: #f7f8f3;
  color: #18221d;
}

.hero-card {
  display: flex;
  align-items: center;
  gap: 24rpx;
  box-sizing: border-box;
  margin-top: 42rpx;
  padding: 34rpx 30rpx;
  overflow: hidden;
  border-radius: 32rpx;
  background: #1e6b52;
  box-shadow: 0 18rpx 40rpx rgba(30, 107, 82, 0.16);
}

.link-logo {
  flex: 0 0 auto;
  width: 118rpx;
  height: 118rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.96);
}

.hero-copy {
  flex: 1;
  min-width: 0;
}

.link-title {
  font-size: 40rpx;
  line-height: 48rpx;
  font-weight: 900;
  color: #ffffff;
}

.link-subtitle {
  margin-top: 10rpx;
  font-size: 25rpx;
  line-height: 36rpx;
  color: rgba(255, 255, 255, 0.78);
}

.steps-card,
.profile-card,
.agreement-card {
  box-sizing: border-box;
  margin-top: 24rpx;
  border: 2rpx solid #e1e8df;
  border-radius: 28rpx;
  background: #ffffff;
}

.steps-card {
  padding: 8rpx 24rpx;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  min-height: 118rpx;
  border-bottom: 2rpx solid #eef2ec;
}

.step-item:last-child {
  border-bottom: 0;
}

.step-dot {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 46rpx;
  height: 46rpx;
  border-radius: 50%;
  background: #fff2c7;
  color: #7a5b12;
  font-size: 24rpx;
  line-height: 30rpx;
  font-weight: 900;
}

.step-item.done .step-dot {
  background: #eaf5ef;
  color: #1e6b52;
}

.step-title {
  font-size: 29rpx;
  line-height: 38rpx;
  font-weight: 900;
  color: #253025;
}

.step-desc {
  margin-top: 4rpx;
  font-size: 23rpx;
  line-height: 32rpx;
  color: #7a8780;
}

.profile-card {
  padding: 26rpx 24rpx 24rpx;
}

.profile-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
}

.profile-title {
  font-size: 30rpx;
  line-height: 40rpx;
  font-weight: 900;
  color: #253025;
}

.profile-desc {
  margin-top: 6rpx;
  font-size: 23rpx;
  line-height: 32rpx;
  color: #7a8780;
}

.avatar-row {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 104rpx;
  margin-top: 22rpx;
  padding: 0 20rpx;
  border-radius: 22rpx;
  background: #f7f8f3;
  text-align: left;
}

.avatar-row::after {
  border: 0;
}

.profile-avatar {
  flex: 0 0 auto;
  width: 68rpx;
  height: 68rpx;
  border-radius: 50%;
  background: #eef2ec;
}

.avatar-copy {
  flex: 1;
  min-width: 0;
  margin-left: 20rpx;
}

.avatar-desc {
  margin-top: 4rpx;
  font-size: 22rpx;
  line-height: 30rpx;
  color: #7a8780;
}

.nickname-row {
  display: flex;
  align-items: center;
  min-height: 92rpx;
  margin-top: 14rpx;
  padding: 0 20rpx;
  border-radius: 22rpx;
  background: #f7f8f3;
}

.nickname-label {
  flex: 0 0 auto;
  font-size: 27rpx;
  line-height: 36rpx;
  font-weight: 900;
  color: #253025;
}

.nickname-input {
  flex: 1;
  min-width: 0;
  height: 72rpx;
  margin-left: 24rpx;
  text-align: right;
  font-size: 28rpx;
  color: #253025;
}

.nickname-placeholder {
  color: #9aa49f;
}

.row-arrow {
  width: 28rpx;
  height: 28rpx;
}

.agreement-card {
  display: flex;
  align-items: center;
  min-height: 96rpx;
  padding: 0 24rpx;
}

.agreement-text {
  flex: 1;
  min-width: 0;
  margin-left: 8rpx;
  font-size: 25rpx;
  line-height: 36rpx;
  color: #303b35;
}

.privacy-link {
  color: #1e6b52;
  font-weight: 800;
}

.login-button {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 92rpx;
  margin-top: 32rpx;
  border-radius: 24rpx;
  color: #ffffff;
  background: #1e6b52;
  font-size: 30rpx;
  line-height: 92rpx;
  font-weight: 900;
}

.login-button.muted {
  color: #7f8b85;
  background: #e8ece8;
}

.login-button::after {
  border: 0;
}
</style>
