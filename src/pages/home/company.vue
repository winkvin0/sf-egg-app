<template>
  <view class="company-page">
    <app-safe-area back />

    <view class="intro-card">
      <view v-if="intro" class="intro-content">
        <rich-text :nodes="intro"></rich-text>
      </view>
      <view v-else class="empty-text">暂无公司介绍</view>
    </view>
  </view>
</template>

<script setup>
import {ref} from 'vue';
import {onLoad, onShareAppMessage} from '@dcloudio/uni-app';
import {baseUrl} from '../../utils/urlUtils';
import {requestBusinessData} from '../../utils/httpUtils';
import {processImgTags} from '../../utils/htmlUtils';
import {SHARE_IMAGES} from "../../utils/shareUtils";

const intro = ref('');

onLoad(() => {
  fetchIntro();
})

onShareAppMessage(() => {
  return {
    title: '公司介绍｜新鲜蛋品稳定供应',
    path: '/pages/home/company',
    imageUrl: SHARE_IMAGES.company
  }
})

function fetchIntro() {
  requestBusinessData({
    url: baseUrl + '/config/intro',
    method: 'GET'
  }, '').then(data => {
    intro.value = processImgTags(typeof data === 'string' ? data : data?.value || '');
  })
}
</script>

<style scoped lang="scss">
.company-page {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 0 32rpx 42rpx;
  background: #f7f8f3;
  color: #18221d;
}

.intro-card {
  box-sizing: border-box;
  padding: 24rpx;
  border: 2rpx solid #e1e8df;
  border-radius: 32rpx;
  background: #ffffff;
}

.intro-content {
  overflow: visible;
  font-size: 26rpx;
  line-height: 42rpx;
  color: #36413a;
}

.empty-text {
  margin-top: 18rpx;
  padding: 26rpx 0;
  text-align: center;
  font-size: 24rpx;
  line-height: 34rpx;
  color: #8b9791;
  background: #fbfcf8;
  border-radius: 24rpx;
}

</style>
