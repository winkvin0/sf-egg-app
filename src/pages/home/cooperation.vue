<template>
  <view class="cooperation-page">
    <app-safe-area back />

    <view class="cooperation-hero">
      <view class="hero-kicker">盛菲蛋业</view>
      <view class="hero-title">商业合作登记</view>
      <view class="hero-subtitle">留下合作意向与联系方式，我们会尽快安排专人跟进。</view>
    </view>

    <view class="form-card">
      <view class="form-head">
        <view>
          <view class="form-title">合作信息</view>
          <view class="form-subtitle">带 * 的项目为必填</view>
        </view>
        <view class="form-badge">登记</view>
      </view>

      <view class="form-field" v-for="field in fields" :key="field.key">
        <view class="field-label-row">
          <view class="field-label">
            {{ field.label }}
            <text v-if="field.required" class="required-mark">*</text>
          </view>
          <view v-if="field.type === 'textarea'" class="field-count">
            {{ String(coopRegister[field.key] || '').length }}/{{ field.max }}
          </view>
        </view>
        <textarea
            v-if="field.type === 'textarea'"
            v-model="coopRegister[field.key]"
            class="field-input field-textarea"
            :maxlength="field.max"
            :placeholder="field.placeholder"
            placeholder-class="field-placeholder"
        />
        <input
            v-else
            v-model="coopRegister[field.key]"
            class="field-input"
            :maxlength="field.max"
            :placeholder="field.placeholder"
            placeholder-class="field-placeholder"
        />
      </view>
    </view>

    <view class="action-bar">
      <button class="reset-button" :disabled="submitting" @click="reset">重置</button>
      <button class="submit-button" :class="{ disabled: submitting }" :disabled="submitting" @click="submit">
        {{ submitting ? '提交中...' : '提交合作意向' }}
      </button>
    </view>

    <view v-if="submitSuccessVisible" class="success-mask">
      <view class="success-dialog">
        <view class="success-icon">✓</view>
        <view class="success-title">提交成功</view>
        <view class="success-desc">合作意向已登记，我们会尽快安排专人跟进。</view>
        <view class="success-hint">{{ countdownSeconds }} 秒后返回首页</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import {isSuccess, request} from "../../utils/httpUtils";
import {onUnmounted, ref} from "vue";
import {baseUrl} from "../../utils/urlUtils";
import {onShareAppMessage} from "@dcloudio/uni-app";
import {showNoneToast} from "../../utils/toastUtils";
import {SHARE_IMAGES} from "../../utils/shareUtils";

onShareAppMessage(() => {
  return {
    title: '商业合作｜留下意向专人跟进',
    path: `/pages/home/cooperation`,
    imageUrl: SHARE_IMAGES.cooperation
  }
})

const coopRegister = ref(
    {
      companyName: '',
      contactName: '',
      contactInfo: '',
      jobTitle: '',
      cooperationNote: '',
      referrer: '',
    }
)
const submitting = ref(false);
const submitSuccessVisible = ref(false);
const countdownSeconds = ref(2);
let backHomeTimer: ReturnType<typeof setTimeout> | null = null;
let countdownTimer: ReturnType<typeof setInterval> | null = null;

const fields = [
  {key: 'companyName', label: '公司名称', max: 100, placeholder: '请填写公司名称', required: true},
  {key: 'contactName', label: '联系人名称', max: 20, placeholder: '请填写联系人名称', required: true},
  {key: 'contactInfo', label: '联系方式', max: 50, placeholder: '请填写联系方式', required: true},
  {key: 'jobTitle', label: '职位', max: 20, placeholder: '请填写职位', required: true},
  {key: 'cooperationNote', label: '合作意向简述', max: 1000, placeholder: '请填写合作意向简述', required: true, type: 'textarea'},
  {key: 'referrer', label: '推荐人', max: 100, placeholder: '选填', required: false},
]

function submit() {
  if (submitting.value || submitSuccessVisible.value) {
    return;
  }
  const invalid = fields.find(field => field.required && !String(coopRegister.value[field.key] || '').trim());
  if (invalid) {
    showNoneToast(invalid.placeholder)
    return;
  }
  uni.showLoading({
    title: '提交中',
    mask: true
  })
  submitting.value = true;
  request({
    url: baseUrl + '/coop-register',
    method: 'POST',
    data: coopRegister.value
  }).then(res => {
      if (!isSuccess(res.data)) {
        showNoneToast('提交失败')
        return;
      }
      reset()
      showSuccessCountdown();
    })
    .catch(() => {
      showNoneToast('提交失败')
    })
    .finally(() => {
      submitting.value = false;
      uni.hideLoading()
    })
}

function reset() {
  coopRegister.value = {
    companyName: '',
    contactName: '',
    contactInfo: '',
    jobTitle: '',
    cooperationNote: '',
    referrer: '',
  }
}

function showSuccessCountdown() {
  clearSuccessTimers();
  countdownSeconds.value = 2;
  submitSuccessVisible.value = true;
  countdownTimer = setInterval(() => {
    countdownSeconds.value = Math.max(countdownSeconds.value - 1, 0);
  }, 1000);
  backHomeTimer = setTimeout(() => {
    uni.switchTab({
      url: `/pages/home/home`
    })
    clearSuccessTimers();
  }, 2000);
}

function clearSuccessTimers() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  if (backHomeTimer) {
    clearTimeout(backHomeTimer);
    backHomeTimer = null;
  }
}

onUnmounted(() => {
  clearSuccessTimers();
})

</script>


<style scoped lang="scss">
.cooperation-page {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 0 32rpx 50rpx;
  background: #f7f8f3;
  color: #18221d;
}

.cooperation-hero {
  box-sizing: border-box;
  padding: 34rpx 34rpx 32rpx;
  border-radius: 36rpx;
  background: #1e6b52;
}

.hero-kicker {
  font-size: 26rpx;
  line-height: 34rpx;
  font-weight: 800;
  color: #ffd365;
}

.hero-title {
  margin-top: 14rpx;
  font-size: 42rpx;
  line-height: 54rpx;
  font-weight: 900;
  color: #ffffff;
}

.hero-subtitle {
  margin-top: 12rpx;
  font-size: 26rpx;
  line-height: 38rpx;
  color: #dcebe4;
}

.form-card {
  box-sizing: border-box;
  margin-top: 20rpx;
  padding: 24rpx;
  border: 2rpx solid #e1e8df;
  border-radius: 32rpx;
  background: #ffffff;
}

.form-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
  margin-bottom: 22rpx;
}

.form-title {
  font-size: 32rpx;
  line-height: 42rpx;
  font-weight: 900;
  color: #1c251f;
}

.form-subtitle {
  margin-top: 4rpx;
  font-size: 22rpx;
  line-height: 30rpx;
  color: #8b9791;
}

.form-badge {
  flex: 0 0 auto;
  height: 44rpx;
  padding: 0 18rpx;
  border-radius: 22rpx;
  line-height: 44rpx;
  font-size: 22rpx;
  font-weight: 800;
  color: #1e6b52;
  background: #edf5ef;
}

.form-field {
  margin-top: 22rpx;
}

.form-field:first-of-type {
  margin-top: 0;
}

.field-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  margin-bottom: 10rpx;
}

.field-label {
  font-size: 26rpx;
  line-height: 34rpx;
  font-weight: 700;
  color: #303a34;
}

.required-mark {
  margin-left: 4rpx;
  color: #d94f2b;
}

.field-count {
  flex: 0 0 auto;
  font-size: 22rpx;
  line-height: 30rpx;
  color: #94a09a;
}

.field-input {
  width: 100%;
  min-height: 82rpx;
  box-sizing: border-box;
  padding: 0 24rpx;
  border: 2rpx solid #e1e8df;
  border-radius: 22rpx;
  background: #fbfcf8;
  font-size: 28rpx;
  color: #18221d;
}

.field-textarea {
  min-height: 210rpx;
  padding-top: 18rpx;
  line-height: 40rpx;
}

.field-placeholder {
  color: #a2ada7;
}

.action-bar {
  display: grid;
  grid-template-columns: 180rpx minmax(0, 1fr);
  gap: 18rpx;
  margin-top: 24rpx;
}

.submit-button,
.reset-button {
  height: 88rpx;
  margin: 0;
  border-radius: 24rpx;
  line-height: 88rpx;
  font-size: 28rpx;
  font-weight: 800;
}

.submit-button::after,
.reset-button::after {
  border: 0;
}

.submit-button {
  color: #ffffff;
  background: #1e6b52;
}

.submit-button.disabled {
  opacity: 0.72;
}

.reset-button {
  color: #1e6b52;
  background: #edf5ef;
}

.success-mask {
  position: fixed;
  z-index: 99;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  padding: 48rpx;
  background: rgba(12, 24, 18, 0.58);
}

.success-dialog {
  width: 100%;
  max-width: 560rpx;
  box-sizing: border-box;
  padding: 48rpx 42rpx 40rpx;
  border-radius: 32rpx;
  background: #ffffff;
  text-align: center;
  box-shadow: 0 24rpx 70rpx rgba(17, 40, 30, 0.28);
}

.success-icon {
  width: 104rpx;
  height: 104rpx;
  margin: 0 auto;
  border-radius: 52rpx;
  background: #1e6b52;
  color: #ffd365;
  font-size: 64rpx;
  line-height: 104rpx;
  font-weight: 900;
}

.success-title {
  margin-top: 28rpx;
  font-size: 38rpx;
  line-height: 48rpx;
  font-weight: 900;
  color: #18221d;
}

.success-desc {
  margin-top: 14rpx;
  font-size: 26rpx;
  line-height: 38rpx;
  color: #59665f;
}

.success-hint {
  margin-top: 22rpx;
  font-size: 24rpx;
  line-height: 34rpx;
  font-weight: 800;
  color: #1e6b52;
}
</style>
