<template>
  <view class="home-page">
    <app-safe-area />

    <view class="company-hero">
      <view class="hero-top">
        <view class="hero-copy">
          <view class="hero-brand">盛菲蛋业</view>
          <view class="hero-title">新鲜蛋品供应</view>
          <view class="hero-subtitle">稳定交付、企业合作与公司动态，一站查看。</view>
        </view>
        <image class="hero-logo" src="/static/app-logo-3.png" mode="aspectFit" />
      </view>
      <view class="hero-action-grid">
        <view class="hero-action-card" @click="toCompany">
          <view class="hero-action-mark"></view>
          <view class="hero-action-copy">
            <view class="hero-action-title">公司介绍</view>
            <view class="hero-action-text">查看盛菲蛋业</view>
          </view>
          <view class="hero-action-arrow"></view>
        </view>
        <view class="hero-action-card" @click="toCooperation">
          <view class="hero-action-mark yellow"></view>
          <view class="hero-action-copy">
            <view class="hero-action-title">商务合作</view>
            <view class="hero-action-text">提交合作意向</view>
          </view>
          <view class="hero-action-arrow"></view>
        </view>
      </view>
    </view>

    <view class="section-head">
      <view class="section-title">公司发文</view>
      <view class="section-badge">最新动态</view>
    </view>
    <view class="section-card">
      <view v-if="posts.length" class="post-list">
        <view class="featured-post" @click="toDetail(posts[0].id)">
          <view class="featured-copy">
            <view class="featured-label">最新发布</view>
            <view class="featured-title">{{ posts[0].title || '未命名文章' }}</view>
            <view class="featured-text">{{ posts[0].textContent || '点击查看详情' }}</view>
            <view class="featured-meta">{{ formatPostDate(posts[0].createTime) }} · 浏览 {{ posts[0].viewCount || 0 }}</view>
          </view>
          <image
              v-if="posts[0].thumbnails"
              class="featured-thumb"
              :src="posts[0].thumbnails"
              mode="aspectFill"
          />
        </view>

        <view
            v-for="post in posts.slice(1)"
            :key="post.id"
            class="post-item"
            @click="toDetail(post.id)"
        >
          <view class="post-copy">
            <view class="post-title">{{ post.title || '未命名文章' }}</view>
            <view class="post-text">{{ post.textContent || '点击查看详情' }}</view>
            <view class="post-meta">{{ formatPostDate(post.createTime) }} · 浏览 {{ post.viewCount || 0 }}</view>
          </view>
          <image
              v-if="post.thumbnails"
              class="post-thumb"
              :src="post.thumbnails"
              mode="aspectFill"
          />
        </view>
      </view>
      <view v-else class="empty-text">暂无文章</view>
    </view>

    <view class="sf-tabbar-spacer"></view>
    <view class="sf-tabbar-wrap">
      <view class="sf-tabbar">
        <view class="sf-tabbar-item active" @click="goTab('/pages/home/home')">
          <view class="sf-tabbar-icon-wrap">
            <image class="sf-tabbar-icon" src="/static/tab-home-active.png" mode="aspectFit"></image>
          </view>
          <text class="sf-tabbar-text">首页</text>
        </view>
        <view class="sf-tabbar-item" @click="goTab('/pages/price/price')">
          <view class="sf-tabbar-icon-wrap">
            <image class="sf-tabbar-icon" src="/static/tab-egg.png" mode="aspectFit"></image>
          </view>
          <text class="sf-tabbar-text">蛋价</text>
        </view>
        <view class="sf-tabbar-item" @click="goTab('/pages/my/my')">
          <view class="sf-tabbar-icon-wrap">
            <image class="sf-tabbar-icon" src="/static/tab-user.png" mode="aspectFit"></image>
          </view>
          <text class="sf-tabbar-text">我的</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import {ref} from 'vue';
import {onLoad, onPullDownRefresh, onShareAppMessage, onShow} from '@dcloudio/uni-app';
import {baseUrl} from '../../utils/urlUtils';
import {requestBusinessData} from '../../utils/httpUtils';
import {formatDate, hideSystemTabBar, switchTabIfNeeded} from "../../utils/appUtils";
import {SHARE_IMAGES} from "../../utils/shareUtils";

const posts = ref([]);

onLoad(() => {
  refreshHomeData();
})

onShow(() => {
  hideSystemTabBar();
})

onPullDownRefresh(() => {
  refreshHomeData().finally(() => {
    uni.stopPullDownRefresh();
  })
})

onShareAppMessage(() => {
  return {
    title: '鲜蛋供应与公司动态',
    path: '/pages/home/home',
    imageUrl: SHARE_IMAGES.home
  }
})

function refreshHomeData() {
  return fetchPosts();
}

function fetchPosts() {
  return requestBusinessData({
    url: baseUrl + '/post/published/page',
    method: 'POST',
    data: {
      page: 1,
      size: 8
    }
  }, []).then(data => {
    posts.value = Array.isArray(data) ? data : [];
  })
}

function toCompany() {
  uni.navigateTo({
    url: '/pages/home/company'
  })
}

function toCooperation() {
  uni.navigateTo({
    url: '/pages/home/cooperation'
  })
}

function toDetail(id) {
  if (!id) {
    return;
  }
  uni.navigateTo({
    url: `/pages/home/post-detail?id=${id}`
  })
}

function formatPostDate(value) {
  return formatDate(value);
}

function goTab(url) {
  switchTabIfNeeded(url, '/pages/home/home');
}
</script>

<style scoped lang="scss">
@use "../../styles/custom-tabbar.scss";

.home-page {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 0 32rpx 28rpx;
  background: #f7f8f3;
  color: #18221d;
}

.company-hero {
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  padding: 34rpx 30rpx 30rpx;
  border-radius: 40rpx;
  background: #1e6b52;
}

.hero-top {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
}

.hero-copy {
  flex: 1;
  min-width: 0;
}

.hero-brand {
  font-size: 28rpx;
  line-height: 36rpx;
  font-weight: 800;
  color: #ffd365;
}

.hero-title {
  margin-top: 16rpx;
  font-size: 42rpx;
  line-height: 54rpx;
  font-weight: 900;
  color: #ffffff;
}

.hero-subtitle {
  margin-top: 12rpx;
  max-width: 420rpx;
  font-size: 26rpx;
  line-height: 38rpx;
  color: #dcebe4;
}

.hero-logo {
  flex: 0 0 auto;
  width: 148rpx;
  height: 148rpx;
  margin-top: 4rpx;
  opacity: 0.92;
}

.hero-action-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
  margin-top: 28rpx;
}

.hero-action-card {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 14rpx;
  box-sizing: border-box;
  min-height: 112rpx;
  padding: 18rpx 16rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.18);
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.14);
}

.hero-action-mark {
  flex: 0 0 auto;
  width: 8rpx;
  height: 58rpx;
  border-radius: 8rpx;
  background: #ffffff;
}

.hero-action-mark.yellow {
  background: #ffd365;
}

.hero-action-copy {
  flex: 1;
  min-width: 0;
}

.hero-action-title {
  font-size: 27rpx;
  line-height: 36rpx;
  font-weight: 900;
  color: #ffffff;
}

.hero-action-text {
  margin-top: 4rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 22rpx;
  line-height: 30rpx;
  font-weight: 700;
  color: #ffd365;
}

.hero-action-arrow {
  flex: 0 0 auto;
  width: 18rpx;
  height: 18rpx;
  margin-right: 4rpx;
  border-top: 4rpx solid rgba(255, 255, 255, 0.74);
  border-right: 4rpx solid rgba(255, 255, 255, 0.74);
  transform: rotate(45deg);
}

.section-card {
  box-sizing: border-box;
  margin-top: 12rpx;
  padding: 20rpx 22rpx 22rpx;
  border: 2rpx solid #e1e8df;
  border-radius: 32rpx;
  background: #ffffff;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  margin-top: 30rpx;
  padding: 0 4rpx;
}

.section-title {
  flex: 1;
  min-width: 0;
  font-size: 30rpx;
  line-height: 40rpx;
  font-weight: 900;
  color: #18221d;
}

.section-badge {
  flex: 0 0 auto;
  height: 42rpx;
  padding: 0 18rpx;
  border-radius: 21rpx;
  line-height: 42rpx;
  font-size: 22rpx;
  font-weight: 800;
  color: #1e6b52;
  background: #eaf3ec;
}

.post-list {
  margin-top: 0;
}

.featured-post {
  display: flex;
  align-items: stretch;
  gap: 18rpx;
  box-sizing: border-box;
  padding: 20rpx;
  border-radius: 26rpx;
  background: #f7fbf5;
}

.featured-copy {
  flex: 1;
  min-width: 0;
}

.featured-label {
  display: inline-block;
  height: 36rpx;
  padding: 0 14rpx;
  border-radius: 18rpx;
  line-height: 36rpx;
  font-size: 20rpx;
  font-weight: 900;
  color: #18221d;
  background: #ffd365;
}

.featured-title {
  display: -webkit-box;
  margin-top: 12rpx;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  font-size: 31rpx;
  line-height: 42rpx;
  font-weight: 900;
  color: #18221d;
}

.featured-text {
  display: -webkit-box;
  min-height: 64rpx;
  margin-top: 8rpx;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  font-size: 23rpx;
  line-height: 32rpx;
  color: #65746c;
}

.featured-meta {
  margin-top: 12rpx;
  font-size: 22rpx;
  line-height: 30rpx;
  color: #8b9791;
}

.featured-thumb {
  flex: 0 0 auto;
  width: 184rpx;
  height: 178rpx;
  border-radius: 24rpx;
  background: #eaf3ec;
}

.post-item {
  display: flex;
  align-items: stretch;
  gap: 18rpx;
  padding: 22rpx 0;
  border-bottom: 2rpx solid #edf2eb;
}

.featured-post + .post-item {
  margin-top: 8rpx;
}

.post-item:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

.post-copy {
  flex: 1;
  min-width: 0;
}

.post-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 28rpx;
  line-height: 38rpx;
  font-weight: 800;
  color: #1c251f;
}

.post-text {
  display: -webkit-box;
  min-height: 60rpx;
  margin-top: 6rpx;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  font-size: 22rpx;
  line-height: 30rpx;
  color: #728078;
}

.post-meta {
  margin-top: 10rpx;
  font-size: 22rpx;
  line-height: 30rpx;
  color: #96a09b;
}

.post-thumb {
  flex: 0 0 auto;
  width: 176rpx;
  height: 126rpx;
  border-radius: 20rpx;
  background: #edf2eb;
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
