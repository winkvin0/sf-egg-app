<template>
  <view class="home-page">
    <app-safe-area />

    <view class="company-hero">
      <view class="hero-brand">盛菲蛋业</view>
      <view class="hero-title">了解盛菲蛋业</view>
      <view class="hero-subtitle">公司介绍、最新文章和商业合作都在这里。</view>
      <view class="hero-stat-grid">
        <view class="hero-stat">
          <view class="hero-stat-value">{{ marketStats.priced }}</view>
          <view class="hero-stat-label">今日有价</view>
        </view>
        <view class="hero-stat">
          <view class="hero-stat-value rise">{{ marketStats.rise }}</view>
          <view class="hero-stat-label">上涨</view>
        </view>
        <view class="hero-stat">
          <view class="hero-stat-value drop">{{ marketStats.drop }}</view>
          <view class="hero-stat-label">下跌</view>
        </view>
      </view>
    </view>

    <view class="action-grid">
      <view class="action-card" @click="toCompany">
        <view class="action-icon">介</view>
        <view>
          <view class="action-title">公司介绍</view>
          <view class="action-text">进入独立页面查看</view>
        </view>
      </view>
      <view class="action-card" @click="toCooperation">
        <view class="action-icon yellow">合</view>
        <view>
          <view class="action-title">商务合作</view>
          <view class="action-text">提交合作意向</view>
        </view>
      </view>
    </view>

    <view class="section-card">
      <view v-if="posts.length" class="post-list">
        <view
            v-for="post in posts"
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
import dayjs from 'dayjs';
import {baseUrl} from '../../utils/urlUtils';
import {requestBusinessData} from '../../utils/httpUtils';
import {buildEggPriceRows, EGG_PRICE_REGIONS, fetchEggPriceDetailAndLatest} from '../../utils/eggPriceUtils';
import {formatDate, hideSystemTabBar, switchTabIfNeeded} from "../../utils/appUtils";

const EGG_PRICE_FIELDS = [
  {price: 'pinkEggPrice', diff: 'pinkEggPriceDiff'},
  {price: 'redEggPrice', diff: 'redEggPriceDiff'},
];

const posts = ref([]);
const marketStats = ref({
  priced: '--',
  rise: '--',
  drop: '--',
});

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
    title: '盛菲动态',
    path: '/pages/home/home',
    imageUrl: baseUrl + '/file/swiper-1-compressed.png'
  }
})

function refreshHomeData() {
  return Promise.all([
    fetchPosts(),
    fetchMarketStats()
  ]);
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

async function fetchMarketStats() {
  const date = dayjs().format('YYYY-MM-DD');
  try {
    const results = await Promise.all(EGG_PRICE_REGIONS.map(region => requestRegionPrices(region.code, date)));
    marketStats.value = summarizeMarketStats(results.flat());
  } catch (error) {
    marketStats.value = {
      priced: '--',
      rise: '--',
      drop: '--',
    };
  }
}

async function requestRegionPrices(regionCode, date) {
  try {
    const {detailPrices, latestPrices} = await fetchEggPriceDetailAndLatest({
      regionCode,
      date
    });
    return buildEggPriceRows(detailPrices, latestPrices, {
      missingReferenceDiff: null
    });
  } catch (error) {
    return [];
  }
}

function summarizeMarketStats(rows) {
  const summary = {
    priced: 0,
    rise: 0,
    drop: 0,
  };

  rows.forEach(row => {
    EGG_PRICE_FIELDS.forEach(field => {
      if (!isValidPrice(row[field.price])) {
        return;
      }
      summary.priced += 1;
      const diff = Number(row[field.diff]);
      if (!Number.isFinite(diff) || diff === 0) {
        return;
      }
      if (diff > 0) {
        summary.rise += 1;
      } else {
        summary.drop += 1;
      }
    })
  })

  return summary;
}

function isValidPrice(value) {
  return value !== null && value !== undefined && value !== '' && Number(value) > 0;
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
  box-sizing: border-box;
  padding: 34rpx 34rpx 32rpx;
  border-radius: 40rpx;
  background: #1e6b52;
}

.hero-brand {
  font-size: 28rpx;
  line-height: 36rpx;
  font-weight: 800;
  color: #ffd365;
}

.hero-title {
  margin-top: 18rpx;
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

.hero-stat-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14rpx;
  margin-top: 26rpx;
}

.hero-stat {
  min-width: 0;
  box-sizing: border-box;
  padding: 16rpx 12rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.12);
}

.hero-stat-value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 34rpx;
  line-height: 42rpx;
  font-weight: 900;
  color: #ffd365;
}

.hero-stat-value.rise {
  color: #ffdf83;
}

.hero-stat-value.drop {
  color: #dcebe4;
}

.hero-stat-label {
  margin-top: 4rpx;
  font-size: 21rpx;
  line-height: 28rpx;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.78);
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18rpx;
  margin-top: 20rpx;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 14rpx;
  box-sizing: border-box;
  min-height: 112rpx;
  padding: 18rpx;
  border: 2rpx solid #e1e8df;
  border-radius: 30rpx;
  background: #ffffff;
}

.action-icon {
  flex: 0 0 auto;
  width: 56rpx;
  height: 56rpx;
  border-radius: 22rpx;
  line-height: 56rpx;
  text-align: center;
  font-size: 24rpx;
  font-weight: 900;
  color: #ffffff;
  background: #1e6b52;
}

.action-icon.yellow {
  color: #18221d;
  background: #ffd365;
}

.action-title {
  font-size: 28rpx;
  line-height: 36rpx;
  font-weight: 800;
  color: #1c251f;
}

.action-text {
  margin-top: 4rpx;
  font-size: 23rpx;
  line-height: 32rpx;
  font-weight: 700;
  color: #3f735f;
}

.section-card {
  box-sizing: border-box;
  margin-top: 20rpx;
  padding: 20rpx 22rpx 22rpx;
  border: 2rpx solid #e1e8df;
  border-radius: 32rpx;
  background: #ffffff;
}

.post-list {
  margin-top: 0;
}

.post-item {
  display: flex;
  align-items: stretch;
  gap: 18rpx;
  padding: 22rpx 0;
  border-bottom: 2rpx solid #edf2eb;
}

.post-item:first-child {
  padding-top: 0;
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
