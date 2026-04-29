<template>
  <view class="price-page">
    <app-safe-area />

    <view id="priceRegionPanel" class="region-panel">
      <view class="region-switcher">
        <view
            class="region-pill"
            :class="{ active: tabIdx === 0 }"
            @click="selectFoshan"
        >
          {{ areaList[0].name }}
        </view>
        <view
            class="region-pill"
            :class="{ active: tabIdx === 1 }"
            @click="selectDongguan"
        >
          {{ areaList[1].name }}
        </view>
        <view
            class="region-pill"
            :class="{ active: tabIdx === 2 }"
            @click="selectGuangzhou"
        >
          {{ areaList[2].name }}
        </view>
      </view>
    </view>

    <view id="priceToolRow" class="tool-row">
      <picker class="tool-button" mode="date" :value="valueDate" @change="confirm">
        <view class="tool-button-inner">
          <image class="tool-icon" src="/static/calendar.svg" mode="aspectFit"></image>
          <text>{{ isToday ? '今日' : displayDate }}</text>
        </view>
      </picker>
      <view class="tool-button primary" @click="toTrend">
        <view class="tool-button-inner">
          <image class="tool-icon" src="/static/trend.svg" mode="aspectFit"></image>
          <text>走势</text>
        </view>
      </view>
    </view>

    <view class="quote-card">
      <view class="quote-table-scroll">
        <view class="quote-table" :style="quoteTableStyle">
        <view class="table-row table-header">
          <view class="cell size-cell">码数</view>
          <view class="cell price-cell">粉蛋指导价</view>
          <view class="cell diff-cell">涨跌</view>
          <view class="cell price-cell">红蛋指导价</view>
          <view class="cell diff-cell">涨跌</view>
        </view>

        <view v-if="loading" class="table-empty">正在加载报价...</view>
        <view v-else-if="!tableRows.length" class="table-empty">暂无该地区报价</view>
        <template v-else>
          <view
              v-for="price in tableRows"
              :key="price.size"
              class="table-row"
          >
            <view class="cell size-cell size-value">{{ price.size || '--' }}</view>
            <view class="cell price-cell price-value">{{ formatPrice(price.pinkEggPrice) }}</view>
            <view class="cell diff-cell">
              <text class="diff-chip" :class="diffClass(price.pinkEggPriceDiff)">
                {{ formatDiff(price.pinkEggPriceDiff) }}
              </text>
            </view>
            <view class="cell price-cell price-value">{{ formatPrice(price.redEggPrice) }}</view>
            <view class="cell diff-cell">
              <text class="diff-chip" :class="diffClass(price.redEggPriceDiff)">
                {{ formatDiff(price.redEggPriceDiff) }}
              </text>
            </view>
          </view>
        </template>
      </view>
      </view>
    </view>

    <view id="priceNoticeCard" class="notice-card">
      <view class="notice-title">报价说明</view>
      <view class="notice-text">鲜鸡蛋，360枚/箱，含包装价，净重，按质定价</view>
    </view>

    <view class="sf-tabbar-spacer"></view>
    <view class="sf-tabbar-wrap">
      <view class="sf-tabbar">
        <view class="sf-tabbar-item" @click="goHome">
          <view class="sf-tabbar-icon-wrap">
            <image class="sf-tabbar-icon" src="/static/tab-home.png" mode="aspectFit"></image>
          </view>
          <text class="sf-tabbar-text">首页</text>
        </view>
        <view class="sf-tabbar-item active" @click="goPrice">
          <view class="sf-tabbar-icon-wrap">
            <image class="sf-tabbar-icon" src="/static/tab-egg-active.png" mode="aspectFit"></image>
          </view>
          <text class="sf-tabbar-text">蛋价</text>
        </view>
        <view class="sf-tabbar-item" @click="goMy">
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
import {computed, getCurrentInstance, nextTick, onUnmounted, ref, watch} from "vue";
import dayjs from "dayjs";
import {baseUrl} from "../../utils/urlUtils";
import {onHide, onPullDownRefresh, onReady, onResize, onShareAppMessage, onShow} from "@dcloudio/uni-app";
import {getWindowWidth} from "../../utils/safeAreaUtils";
import {
  DEFAULT_EGG_PRICE_SIZES,
  EGG_PRICE_REGIONS,
  buildEggPriceRows,
  fetchEggPriceDetailAndLatest,
  toPriceNumber
} from "../../utils/eggPriceUtils";
import {hideSystemTabBar, switchTabIfNeeded} from "../../utils/appUtils";

const areaList = ref(EGG_PRICE_REGIONS)
const PRICE_REFRESH_INTERVAL_MS = 60 * 1000;
const tabIdx = ref(0);
const date = ref(dayjs());
const prices = ref([]);
const loading = ref(false);
const quoteHeaderHeight = ref(32);
const quoteHeaderFontSize = ref(10);
const quoteRowPadding = ref(2);
const quoteSizeFontSize = ref(12);
const quoteSizeLineHeight = ref(14);
const quotePriceFontSize = ref(13);
const quotePriceLineHeight = ref(15);
const quoteDiffChipHeight = ref(14);
const quoteDiffChipMinWidth = ref(34);
const quoteDiffChipPadding = ref(3);
const quoteDiffChipFontSize = ref(9);
const instance = getCurrentInstance();
let quoteTableMeasureTimer = null;
let priceRefreshTimer = null;

onShareAppMessage(() => {
  return {
    title: '今日蛋价',
    path: `/pages/price/price`,
    imageUrl: baseUrl + '/file/swiper-1-compressed.png'
  }
})

onShow(() => {
  hideSystemTabBar();
  syncEggPrice();
  startPriceRefreshTimer();
  updateQuoteTableHeight();
})

onHide(() => {
  clearPriceRefreshTimer();
})

onReady(() => {
  updateQuoteTableHeight();
})

onResize(() => {
  updateQuoteTableHeight();
})

onUnmounted(() => {
  clearPriceRefreshTimer();
  clearQuoteTableMeasureTimer();
})

onPullDownRefresh(() => {
  syncEggPrice().finally(() => {
    uni.stopPullDownRefresh();
  })
})

watch([tabIdx, date], () => {
  syncEggPrice();
})

const currentArea = computed(() => {
  return areaList.value[tabIdx.value] || areaList.value[0];
})

const tableRows = computed(() => {
  return [...prices.value].sort((a, b) => Number(b.size || 0) - Number(a.size || 0));
})

const quoteTableStyle = computed(() => {
  return {
    '--quote-header-height': `${quoteHeaderHeight.value}px`,
    '--quote-header-font-size': `${quoteHeaderFontSize.value}px`,
    '--quote-row-padding': `${quoteRowPadding.value}px`,
    '--quote-size-font-size': `${quoteSizeFontSize.value}px`,
    '--quote-size-line-height': `${quoteSizeLineHeight.value}px`,
    '--quote-price-font-size': `${quotePriceFontSize.value}px`,
    '--quote-price-line-height': `${quotePriceLineHeight.value}px`,
    '--quote-diff-chip-height': `${quoteDiffChipHeight.value}px`,
    '--quote-diff-chip-min-width': `${quoteDiffChipMinWidth.value}px`,
    '--quote-diff-chip-padding': `${quoteDiffChipPadding.value}px`,
    '--quote-diff-chip-font-size': `${quoteDiffChipFontSize.value}px`
  };
})

watch(tableRows, () => {
  updateQuoteTableHeight();
})

const displayDate = computed(() => {
  return date.value.format("M月D日");
})

const valueDate = computed(() => {
  return date.value.format("YYYY-MM-DD");
})

const isToday = computed(() => {
  return date.value.isSame(dayjs(), 'day');
})

function tabChange(index) {
  tabIdx.value = index;
}

function selectFoshan() {
  tabChange(0);
}

function selectDongguan() {
  tabChange(1);
}

function selectGuangzhou() {
  tabChange(2);
}

function syncEggPrice() {
  loading.value = true;
  const params = {
    date: date.value.format("YYYY-MM-DD"),
    regionCode: currentArea.value.code
  };

  return fetchEggPriceDetailAndLatest(params)
      .then(({detailPrices, latestPrices}) => {
        prices.value = buildEggPriceRows(detailPrices, latestPrices, {
          includeReferenceOnly: true,
          missingReferenceDiff: 0,
          sizes: DEFAULT_EGG_PRICE_SIZES
        });
      })
      .catch(() => {
        prices.value = [];
      })
      .finally(() => {
        loading.value = false;
        updateQuoteTableHeight();
      })
}

function startPriceRefreshTimer() {
  clearPriceRefreshTimer();
  priceRefreshTimer = setInterval(() => {
    syncEggPrice();
  }, PRICE_REFRESH_INTERVAL_MS);
}

function clearPriceRefreshTimer() {
  if (priceRefreshTimer) {
    clearInterval(priceRefreshTimer);
    priceRefreshTimer = null;
  }
}

function confirm(e) {
  date.value = dayjs(e.detail.value);
}

function toTrend() {
  uni.navigateTo({
    url: `/pages/price/trend?regionCode=${currentArea.value.code}`
  });
}

function formatPrice(value) {
  if (Number(value) < 0 || value === null || value === undefined) {
    return '-';
  }
  return toPriceNumber(value).toFixed(2);
}

function formatDiff(value) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return '0.00';
  }

  if (parsed > 0) {
    return `+${parsed.toFixed(2)}`;
  }

  return parsed.toFixed(2);
}

function diffClass(value) {
  const parsed = Number(value);

  if (parsed > 0) {
    return 'rise';
  }

  if (parsed < 0) {
    return 'drop';
  }

  return 'flat';
}

function goTab(url) {
  switchTabIfNeeded(url, '/pages/price/price');
}

function goHome() {
  goTab('/pages/home/home');
}

function goPrice() {
  goTab('/pages/price/price');
}

function goMy() {
  goTab('/pages/my/my');
}

function updateQuoteTableHeight() {
  nextTick(() => {
    measureQuoteTableHeight();
    clearQuoteTableMeasureTimer();
    quoteTableMeasureTimer = setTimeout(() => {
      measureQuoteTableHeight();
    }, 80);
  })
}

function measureQuoteTableHeight() {
  const query = uni.createSelectorQuery();
  const scopedQuery = instance?.proxy ? query.in(instance.proxy) : query;

  scopedQuery
      .select('.quote-table-scroll').boundingClientRect()
      .exec(rects => {
        const [tableRect] = rects || [];
        const tableHeight = Number(tableRect?.height);

        if (!tableHeight) {
          return;
        }

        const rows = loading.value || !tableRows.value.length ? 1 : tableRows.value.length;
        const nextHeaderHeight = clamp(tableHeight * 0.06, rpxToPx(32), rpxToPx(42));
        const tableBorderReserve = rpxToPx(4);
        const nextRowHeight = Math.max(1, (tableHeight - nextHeaderHeight - tableBorderReserve) / rows);
        const nextDiffChipHeight = clamp(nextRowHeight * 0.74, rpxToPx(24), rpxToPx(34));

        const nextPriceFontSize = Math.floor(clamp(nextRowHeight * 0.48, rpxToPx(19), rpxToPx(28)));
        const nextPriceLineHeight = Math.floor(clamp(nextRowHeight * 0.59, rpxToPx(21), rpxToPx(31)));
        const sizeFontStep = Math.max(1, Math.round(rpxToPx(2)));

        quoteHeaderHeight.value = Math.floor(nextHeaderHeight);
        quoteHeaderFontSize.value = Math.floor(clamp(nextHeaderHeight * 0.52, rpxToPx(19), rpxToPx(22)));
        quoteRowPadding.value = Math.floor(clamp(nextRowHeight * 0.08, 1, rpxToPx(4)));
        quoteSizeFontSize.value = Math.max(1, nextPriceFontSize - sizeFontStep);
        quoteSizeLineHeight.value = Math.max(1, nextPriceLineHeight - sizeFontStep);
        quotePriceFontSize.value = nextPriceFontSize;
        quotePriceLineHeight.value = nextPriceLineHeight;
        quoteDiffChipHeight.value = Math.floor(nextDiffChipHeight);
        quoteDiffChipMinWidth.value = Math.floor(clamp(nextDiffChipHeight * 2.52, rpxToPx(66), rpxToPx(84)));
        quoteDiffChipPadding.value = Math.floor(clamp(nextDiffChipHeight * 0.2, rpxToPx(6), rpxToPx(9)));
        quoteDiffChipFontSize.value = Math.floor(clamp(nextDiffChipHeight * 0.68, rpxToPx(18), rpxToPx(22)));
      });
}

function clearQuoteTableMeasureTimer() {
  if (quoteTableMeasureTimer) {
    clearTimeout(quoteTableMeasureTimer);
    quoteTableMeasureTimer = null;
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function rpxToPx(value) {
  const windowWidth = getWindowWidth();
  return Number(value) * windowWidth / 750;
}
</script>

<style scoped lang="scss">
@use "../../styles/custom-tabbar.scss";

.price-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  height: 100vh;
  box-sizing: border-box;
  overflow: hidden;
  padding: 6rpx 28rpx calc(128rpx + env(safe-area-inset-bottom));
  background: #f7f8f3;
  color: #18221d;
}

.price-page .sf-tabbar-spacer {
  display: none;
  height: 0;
}

.region-panel {
  padding: 4rpx;
  border-radius: 44rpx;
  background: #ffffff;
  border: 2rpx solid #e1e8df;
}

.region-switcher {
  display: flex;
  gap: 6rpx;
}

.region-pill {
  flex: 1;
  height: 72rpx;
  border-radius: 36rpx;
  text-align: center;
  line-height: 72rpx;
  font-size: 28rpx;
  font-weight: 800;
  color: #5d6a63;
}

.region-pill.active {
  color: #ffffff;
  background: #1e6b52;
  box-shadow: 0 8rpx 18rpx rgba(30, 107, 82, 0.18);
}

.tool-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12rpx;
  margin-top: 12rpx;
}

.tool-button {
  min-width: 0;
}

.tool-button-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  box-sizing: border-box;
  height: 72rpx;
  border: 2rpx solid #e1e8df;
  border-radius: 36rpx;
  font-size: 26rpx;
  font-weight: 800;
  color: #1e6b52;
  background: #ffffff;
}

.tool-button.primary .tool-button-inner {
  border-color: #1e6b52;
  color: #ffffff;
  background: #1e6b52;
}

.tool-icon {
  width: 30rpx;
  height: 30rpx;
}

.quote-card,
.notice-card {
  box-sizing: border-box;
  margin-top: 8rpx;
  border: 2rpx solid #e1e8df;
  background: #ffffff;
}

.quote-card {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 10rpx;
  border-radius: 28rpx;
}

.quote-table-scroll {
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  margin-top: 0;
}

.quote-table {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  height: 100%;
  min-height: 100%;
  overflow: hidden;
  border: 2rpx solid #edf2eb;
  border-radius: 24rpx;
  background: #fbfcf8;
}

.table-row {
  flex: 0 0 auto;
  display: grid;
  grid-template-columns: 0.74fr 1.25fr 0.86fr 1.25fr 0.86fr;
  box-sizing: border-box;
  min-height: 0;
  overflow: hidden;
  border-top: 2rpx solid #edf2eb;
}

.table-row:not(.table-header) {
  flex: 1 1 0;
}

.table-row:first-child {
  border-top: 0;
}

.table-header {
  flex: 0 0 auto;
  height: var(--quote-header-height);
  flex-basis: var(--quote-header-height);
  background: #f1f5ef;
}

.cell {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  box-sizing: border-box;
  padding: var(--quote-row-padding) 6rpx;
  overflow: hidden;
  border-left: 2rpx solid #edf2eb;
  text-align: center;
}

.cell:first-child {
  border-left: 0;
}

.table-header .cell {
  padding-top: 0;
  padding-bottom: 0;
  font-size: var(--quote-header-font-size);
  line-height: 24rpx;
  font-weight: 800;
  color: #66736b;
}

.size-value {
  font-size: var(--quote-size-font-size);
  line-height: var(--quote-size-line-height);
  font-weight: 900;
  color: #1e6b52;
}

.price-value {
  font-size: var(--quote-price-font-size);
  line-height: var(--quote-price-line-height);
  font-weight: 900;
  color: #33463d;
}

.diff-chip {
  min-width: var(--quote-diff-chip-min-width);
  height: var(--quote-diff-chip-height);
  padding: 0 var(--quote-diff-chip-padding);
  border-radius: calc(var(--quote-diff-chip-height) / 2);
  line-height: var(--quote-diff-chip-height);
  font-size: var(--quote-diff-chip-font-size);
  font-weight: 800;
}

.diff-chip.rise {
  color: #9a5a00;
  background: #fff2d5;
}

.diff-chip.drop {
  color: #1d7a4a;
  background: #eaf7ef;
}

.diff-chip.flat {
  color: #7c8881;
  background: #eef2ec;
}

.table-empty {
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  padding: 42rpx 20rpx;
  text-align: center;
  font-size: 24rpx;
  line-height: 34rpx;
  color: #8b9791;
}

.notice-card {
  padding: 12rpx 18rpx;
  border-radius: 24rpx;
}

.notice-title {
  font-size: 24rpx;
  line-height: 30rpx;
  font-weight: 900;
  color: #1c251f;
}

.notice-text {
  margin-top: 2rpx;
  font-size: 22rpx;
  line-height: 28rpx;
  color: #9a5a00;
}

</style>
