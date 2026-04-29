<template>
  <view class="edit-page">
    <app-safe-area back />

    <view class="page-head">
      <view class="head-title">编辑资料</view>
      <view class="head-desc">维护昵称和邮箱，方便后续服务识别。</view>
    </view>

    <view class="form-card">
      <button class="avatar-button" :loading="avatarUploading" :disabled="avatarUploading" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
        <image class="avatar" :src="avatarPreview" mode="aspectFill"></image>
        <view class="avatar-copy">
          <view class="field-title">头像</view>
          <view class="field-desc">{{ avatarDesc }}</view>
        </view>
        <image class="row-arrow" src="/static/right-arrow.svg" mode="aspectFit"></image>
      </button>

      <view class="field-row">
        <view class="field-title">昵称</view>
        <input
          class="field-input"
          type="nickname"
          maxlength="20"
          placeholder="未填写则显示默认昵称"
          placeholder-class="input-placeholder"
          v-model="form.nickname"
        />
      </view>
      <view class="field-row">
        <view class="field-title">邮箱</view>
        <input
          class="field-input"
          type="text"
          maxlength="60"
          placeholder="请输入邮箱"
          placeholder-class="input-placeholder"
          v-model="form.email"
        />
      </view>
    </view>

    <view class="tips-card">
      <view class="tips-title">资料保存说明</view>
      <view class="tips-desc">资料会优先在本机展示；如果服务端资料接口可用，将同步提交到后台。</view>
    </view>

    <button class="save-button" :loading="saving" :disabled="saving || avatarUploading" @click="saveProfile">
      保存资料
    </button>
  </view>
</template>

<script setup>
import {onShow} from "@dcloudio/uni-app";
import {computed, reactive, ref} from "vue";
import {baseUrl} from "../../utils/urlUtils";
import {isSuccess, request} from "../../utils/httpUtils";
import {
  authState,
  ensureAuthProfile,
  getSatoken,
  hasBoundPhone,
  hydrateAuthProfileFromCache,
  isAuthProfileCacheExpired,
  setGlobalUserProfile
} from "../../utils/authUtils";
import {resolveBackendFileUrl, uploadImage} from "../../utils/fileUtils";
import {showNoneToast, showSuccessToast} from "../../utils/toastUtils";

const defaultAvatar = "/static/default-avatar.svg";
const emailPattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const saving = ref(false);
const avatarUploading = ref(false);
const form = reactive({
  avatar: defaultAvatar,
  nickname: "",
  email: "",
})

const avatarPreview = computed(() => {
  return resolveBackendFileUrl(form.avatar) || defaultAvatar;
})

const avatarDesc = computed(() => {
  return avatarUploading.value ? "头像上传中" : "点击更换微信头像";
})

onShow(() => {
  hydrateAuthProfileFromCache({allowExpired: true});
  const draft = uni.getStorageSync('sf_user_profile_draft') || {};
  form.avatar = getEditableAvatar(draft, authState.user);
  form.nickname = draft.nickname || authState.user?.nickname || "";
  form.email = draft.email || authState.user?.email || "";
  loadRemoteUser();
})

async function loadRemoteUser() {
  const satoken = getSatoken();
  if (!satoken) {
    uni.switchTab({url: '/pages/my/my'});
    return;
  }
  try {
    await ensureAuthProfile({refresh: isAuthProfileCacheExpired()});
    if (!hasBoundPhone(authState.user)) {
      uni.navigateTo({url: '/pages/my/link'});
      return;
    }
    const draft = uni.getStorageSync('sf_user_profile_draft') || {};
    form.avatar = getEditableAvatar(draft, authState.user);
    form.nickname = draft.nickname || authState.user.nickname || "";
    form.email = draft.email || authState.user.email || "";
  } catch (e) {
    showNoneToast('资料加载失败')
  }
}

async function onChooseAvatar(event) {
  const avatarUrl = event.detail.avatarUrl;
  if (!avatarUrl) {
    return;
  }
  avatarUploading.value = true;
  try {
    const uploaded = await uploadImage(avatarUrl);
    form.avatar = resolveBackendFileUrl(uploaded.url);
  } catch (e) {
    showNoneToast('头像上传失败')
  } finally {
    avatarUploading.value = false;
  }
}

async function saveProfile() {
  const nickname = form.nickname.trim();
  const email = form.email.trim();
  if (email && !isValidEmail(email)) {
    showNoneToast('请输入正确邮箱')
    return;
  }

  saving.value = true;
  const profile = {
    nickname,
    email,
  }
  if (form.avatar && form.avatar !== defaultAvatar) {
    profile.avatar = form.avatar;
  }
  const currentDraft = uni.getStorageSync('sf_user_profile_draft') || {};
  const nextDraft = {
    ...currentDraft,
    ...profile,
  };
  if (!profile.avatar) {
    delete nextDraft.avatar;
  }
  uni.setStorageSync('sf_user_profile_draft', nextDraft);
  setGlobalUserProfile({
    ...(authState.user || {}),
    ...profile,
  });

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
      showNoneToast('已保存到本机')
      return;
    }
    if (resp.data?.data) {
      setGlobalUserProfile(resp.data.data);
    }
    showSuccessToast('保存成功')
    setTimeout(() => {
      uni.navigateBack();
    }, 500)
  } catch (e) {
    showNoneToast('已保存到本机')
  } finally {
    saving.value = false;
  }
}

function isValidEmail(email) {
  return email.length <= 100 && emailPattern.test(email);
}

function getEditableAvatar(draft, user) {
  if (isUsableAvatar(user?.avatar)) {
    return user.avatar;
  }
  if (isUsableAvatar(draft?.avatar)) {
    return resolveBackendFileUrl(draft.avatar);
  }
  return defaultAvatar;
}

function isUsableAvatar(avatar) {
  return Boolean(avatar && avatar !== defaultAvatar);
}
</script>

<style scoped lang="scss">
.edit-page {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 0 32rpx 56rpx;
  background: #f7f8f3;
  color: #18221d;
}

.page-head {
  margin-top: 24rpx;
}

.head-title {
  font-size: 44rpx;
  line-height: 56rpx;
  font-weight: 900;
}

.head-desc {
  margin-top: 8rpx;
  font-size: 25rpx;
  line-height: 36rpx;
  color: #6f7d76;
}

.form-card,
.tips-card {
  box-sizing: border-box;
  margin-top: 28rpx;
  border: 2rpx solid #e1e8df;
  border-radius: 28rpx;
  background: #ffffff;
}

.form-card {
  padding: 0 24rpx;
}

.avatar-button {
  display: flex;
  align-items: center;
  width: 100%;
  height: 150rpx;
  padding: 0;
  border-bottom: 2rpx solid #eef2ec;
  border-radius: 0;
  background: transparent;
  text-align: left;
}

.avatar-button::after {
  border: 0;
}

.avatar {
  width: 92rpx;
  height: 92rpx;
  border-radius: 50%;
  background: #eef2ec;
}

.avatar-copy {
  flex: 1;
  min-width: 0;
  margin-left: 22rpx;
}

.field-row {
  display: flex;
  align-items: center;
  min-height: 122rpx;
  border-bottom: 2rpx solid #eef2ec;
}

.field-row:last-child {
  border-bottom: 0;
}

.field-title {
  font-size: 29rpx;
  line-height: 38rpx;
  font-weight: 900;
  color: #253025;
}

.field-desc {
  margin-top: 6rpx;
  font-size: 23rpx;
  line-height: 32rpx;
  color: #7a8780;
}

.field-input {
  flex: 1;
  min-width: 0;
  height: 76rpx;
  margin-left: 40rpx;
  text-align: right;
  font-size: 29rpx;
  color: #253025;
}

.input-placeholder {
  color: #a8b1ac;
}

.row-arrow {
  width: 28rpx;
  height: 28rpx;
}

.tips-card {
  padding: 24rpx 26rpx;
  background: #fff9e8;
  border-color: #f2e2ac;
}

.tips-title {
  font-size: 26rpx;
  line-height: 34rpx;
  font-weight: 900;
  color: #7a5b12;
}

.tips-desc {
  margin-top: 8rpx;
  font-size: 24rpx;
  line-height: 36rpx;
  color: #766739;
}

.save-button {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 92rpx;
  margin-top: 34rpx;
  border-radius: 24rpx;
  background: #1e6b52;
  color: #ffffff;
  font-size: 30rpx;
  line-height: 92rpx;
  font-weight: 900;
}

.save-button::after {
  border: 0;
}
</style>
