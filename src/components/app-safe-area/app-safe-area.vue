<template>
  <view class="app-safe-area" :style="{ height: safeTopHeight + 'px' }">
    <view v-if="back" class="safe-back" @click="goBack">
      <text class="safe-back-icon">‹</text>
    </view>
  </view>
</template>

<script setup>
import {onMounted, ref} from 'vue';
import {getSafeTopHeight} from '@/utils/safeAreaUtils';

defineProps({
  back: {
    type: Boolean,
    default: false,
  },
});

const safeTopHeight = ref(16);

onMounted(() => {
  updateHeight();
})

function updateHeight() {
  safeTopHeight.value = getSafeTopHeight(8);
}

function goBack() {
  const pages = getCurrentPages();
  if (pages.length > 1) {
    uni.navigateBack();
    return;
  }
  uni.switchTab({
    url: '/pages/home/home',
    fail: () => {
      uni.reLaunch({url: '/pages/home/home'});
    }
  })
}
</script>

<style scoped lang="scss">
.app-safe-area {
  position: relative;
  width: 100%;
  flex: 0 0 auto;
}

.safe-back {
  position: absolute;
  left: 0;
  bottom: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64rpx;
  height: 64rpx;
  border: 2rpx solid rgba(225, 232, 223, 0.9);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 10rpx 24rpx rgba(30, 50, 39, 0.08);
}

.safe-back-icon {
  margin-top: -4rpx;
  font-size: 52rpx;
  line-height: 52rpx;
  font-weight: 500;
  color: #1e6b52;
}
</style>
