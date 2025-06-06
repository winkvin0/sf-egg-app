<template>
  <view style="display: flex;flex-direction: column;gap: 20rpx">
    <!--    <view style="display: flex;">-->
    <!--&lt;!&ndash;      <image src="/static/query.svg" style="width: 50rpx;height: auto; margin-left: 10rpx"></image>&ndash;&gt;-->
    <!--    </view>-->
    <uv-tabs :scrollable="false" :list="areaList" :current="tabIdx" @change="tabChange"></uv-tabs>
    <view style="font-size: 35rpx;text-align: center">{{ areaList[tabIdx].name }} - 指导价</view>
    <view style="display: flex;">
      <view class="icon-label" @click="openCalender">
        <image src="/static/calendar.svg" style="width: 40rpx; height: 40rpx;"></image>
        <view>{{ displayDate }}</view>
      </view>
      <view class="icon-label" @click="toTrend">
        <image src="/static/trend.svg" style="width: 40rpx; height: 40rpx"></image>
        <view>走势</view>
      </view>
      <!--      <view class="icon-label" @click="share">-->
      <!--        <image src="/static/share.svg" style="width: 40rpx; height: 40rpx" @click="openCalender"></image>-->
      <!--        <view>分享</view>-->
      <!--      </view>-->
      <!--      <view class="icon-label">-->
      <!--        <image src="/static/like.svg" style="width: 40rpx; height: 40rpx" @click="openCalender"></image>-->
      <!--        <view>关注</view>-->
      <!--      </view>-->
    </view>

    <view class="table">
      <view class="header-row" style="margin-bottom: 10rpx">
        <view class="header-cell header">码数</view>
        <view class="header-cell-large header">粉蛋指导价</view>
        <view class="header-cell header">涨跌</view>
        <view class="header-cell-large header">红蛋指导价</view>
        <view class="header-cell header">涨跌</view>
      </view>
      <!-- 表格内容 -->
      <view class="table-row" v-for="(price, rowIndex) in prices" :key="rowIndex">
        <view class="table-cell header">{{ price.size }}</view>
        <view class="table-cell-large header">{{ price.pinkEggPrice }}</view>
        <view class="table-cell header">
          {{ price.pinkEggPriceDiff > 0 ? '+' + price.pinkEggPriceDiff : price.pinkEggPriceDiff }}
        </view>
        <view class="table-cell-large header">{{ price.redEggPrice }}</view>
        <view class="table-cell header">
          {{ price.redEggPriceDiff > 0 ? '+' + price.redEggPriceDiff : price.redEggPriceDiff }}
        </view>
      </view>
    </view>
    <view style="text-align: center;font-size: 28rpx">鲜鸡蛋，360枚/箱，含包装价，净重，按质定价</view>
    <view style="text-align: center;font-size: 22rpx;color: #a7251b">以上报价仅供参考具体以实际成交为准</view>
  </view>
  <uv-calendars :date="valueDate" ref="calendar" @confirm="confirm"></uv-calendars>
</template>

<script setup>
import {computed, onMounted, ref, watchEffect} from "vue";
import dayjs from "dayjs";
import {baseUrl} from "../../utils/urlUtils";
import {onShareAppMessage, onShow} from "@dcloudio/uni-app";

onShareAppMessage(() => {
  return {
    title: '今日蛋价',
    path: `/pages/price/price`,
    imageUrl: baseUrl + '/file/swiper-1-compressed.png'
  }
})

const tabIdx = ref(0);

function tabChange(item) {
  tabIdx.value = item.index
}

const areaList = ref([{
  name: '佛山',
  code: '4406'
}, {
  name: '东莞',
  code: '4419'
}, {
  name: '广州',
  code: '4401'
},])

const calendar = ref(null)
const date = ref(dayjs())

const prices = ref([])

onShow(() => {
  syncEggPrice()
})

watchEffect(() => {
  syncEggPrice()
})

function syncEggPrice() {
  uni.request({
    url: baseUrl + '/app/price/egg',
    method: 'GET',
    data: {
      date: date.value.format("YYYY-MM-DD"),
      regionCode: areaList.value[tabIdx.value].code
    },
    success: (res) => {
      prices.value = res.data.data
    }
  })
}


const displayDate = computed(() => {
  return date.value.format("M月D日");
})

const valueDate = computed(() => {
  return date.value.format("YYYY-MM-DD");
})

function openCalender() {
  calendar.value.open()
}

function toTrend() {
  uni.navigateTo({
    url: `/pages/price/trend?regionCode=${areaList.value[tabIdx.value].code}`
  });
}

function confirm(e) {
  date.value = dayjs(e.fulldate)
}
</script>

<style scoped lang="scss">
@import "@climblee/uv-ui/theme.scss";

.icon-label {
  display: flex;
  justify-content: center;
  flex: 1
}

.table {
  font-size: 25rpx;
  width: 100%;
  padding: 0 20rpx;
  margin: 10rpx auto;
  box-sizing: border-box;
  border-collapse: collapse;
}

.header-row {
  display: flex;
}

.table-row {
  display: flex;
}

.table-cell {
  background-color: rgba(238, 187, 189, 0.6);
  padding: 8rpx;
  flex: 1;
  border: 1px solid black;
  text-align: center;
  box-sizing: border-box;
  font-weight: bold;
}

.table-cell-large {
  padding: 8rpx;
  flex: 2;
  border: 1px solid black;
  text-align: center;
  box-sizing: border-box;
}

/* 表头样式 */
.header-cell {
  color: $uv-tips-color;
  text-align: center;
  flex: 1;
  box-sizing: border-box;
}

.header-cell-large {
  color: $uv-tips-color;
  text-align: center;
  flex: 2; /* 平均分配宽度 */
  box-sizing: border-box;
}

/* 防止边框重叠 */
.table-row:not(:last-child) .table-cell {
  border-bottom: none; /* 移除非最后一行单元格的下边框 */
}

.table-cell:not(:last-child) {
  border-right: none; /* 移除非最后一列单元格的右边框 */
}

/* 防止边框重叠 */
.table-row:not(:last-child) .table-cell-large {
  border-bottom: none; /* 移除非最后一行单元格的下边框 */
}

.table-cell-large:not(:last-child) {
  border-right: none; /* 移除非最后一列单元格的右边框 */
}
</style>
