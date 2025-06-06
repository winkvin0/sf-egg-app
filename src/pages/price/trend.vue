<template>
  <view style="display: flex;flex-direction: column;justify-content: center;gap: 20rpx">

    <view style="text-align: center">{{ regionName }}近7日鸡蛋价格</view>
    <uv-tabs :scrollable="false" :list="typeList" :current="tabIdx" @change="tabChange"></uv-tabs>
    <uv-button custom-style="max-width:100rpx;" type="primary" :text="'码数' + size" @click="openPicker"></uv-button>
    <uv-picker ref="picker" :columns="sizeList" @confirm="pickSize"></uv-picker>

    <view>
      <qiun-data-charts
          type="line"
          :opts="lineOpts"
          :chartData="eggTrend"
          :canvas2d="true"
      />
    </view>

    <view>
      <qiun-data-charts
          type="column"
          :opts="columnOpt"
          :chartData="areaTrend"
          :canvas2d="true"
      />
    </view>
  </view>
</template>

<script setup>
import {computed, ref, watchEffect} from "vue";
import {onShareAppMessage, onShow} from "@dcloudio/uni-app";
import dayjs from "dayjs";
import {baseUrl} from "../../utils/urlUtils";

const size = ref(45)
const sizeList = ref([Array.from({length: 45 - 30 + 1}, (_, index) => 45 - index)])
const picker = ref(null)

onShareAppMessage(() => {
  return {
    title: '今日蛋价',
    path: `/pages/price/price`,
    imageUrl: baseUrl + '/file/swiper-1-compressed.png'
  }
})

function openPicker() {
  picker.value.open()
}

function pickSize(event) {
  size.value = event.value[0];
}

const tabIdx = ref(0);

function tabChange(item) {
  tabIdx.value = item.index
}

const typeList = ref([{
  name: '红蛋',
  type: 'RED'
}, {
  name: '粉蛋',
  type: 'PINK'
}])

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
const regionCode = ref('4406')
const regionName = computed(() => {
  const area = areaList.value.find(item => item.code === regionCode.value);
  return area ? area.name : '未找到';
})

onShow((option) => {
  regionCode.value = option.regionCode;
  syncDailyTrend()
  syncRegionTrend()
})


watchEffect(() => {
  syncDailyTrend()
  syncRegionTrend()
})

function syncDailyTrend() {
  uni.request({
    url: baseUrl + '/app/price/egg/daily/trend',
    method: 'POST',
    data: {
      regionCode: regionCode.value,
      size: size.value,
      eggType: typeList.value[tabIdx.value].type,
      dateRange: [dayjs().subtract('6', 'day').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')],
    },
    success: (res) => {
      eggTrend.value.series[0].data = res.data.data
    },
  })
}

function syncRegionTrend() {
  uni.request({
    url: baseUrl + '/app/price/egg/region/trend',
    method: 'POST',
    data: {
      size: size.value,
      eggType: typeList.value[tabIdx.value].type,
      regionCodes: areaList.value.map(item => item.code),
    },
    success: (res) => {
      areaTrend.value.series[0].data = res.data.data
    },
  })
}


const lineOpts = ref({
  color: ["#1890FF", "#91CB74", "#FAC858", "#EE6666", "#73C0DE", "#3CA272", "#FC8452", "#9A60B4", "#ea7ccc"],
  padding: [15, 10, 0, 15],
  enableScroll: false,
  legend: {},
  xAxis: {
    disableGrid: true
  },
  yAxis: {
    gridType: "dash",
    dashLength: 2
  },
  extra: {
    line: {
      type: "straight",
      width: 2,
      activeType: "hollow"
    }
  }
})

const eggTrend = ref({
      categories: getDateRangeList(),
      series: [
        {
          name: "指导价",
          data: [0, 0, 0, 0, 0, 0, 0]
        }
      ]
    }
)

const columnOpt = ref({
  color: ["#FAC858", "#EE6666", "#FAC858", "#EE6666", "#73C0DE", "#3CA272", "#FC8452", "#9A60B4", "#ea7ccc"],
  padding: [15, 15, 0, 5],
  enableScroll: false,
  legend: {},
  xAxis: {
    disableGrid: true
  },
  yAxis: {
    data: [
      {
        min: 0
      }
    ]
  },
  extra: {
    column: {
      type: "group",
      width: 10,
      activeBgColor: "#000000",
      activeBgOpacity: 0.08,
      linearType: "custom",
      seriesGap: 5,
      linearOpacity: 0.5,
      barBorderCircle: true,
      customColor: [
        "#FA7D8D",
        "#EB88E2"
      ]
    }
  }
})

const areaTrend = ref({
  categories: ["广东佛山", "广东东莞", "广东广州"],
  series: [
    {
      name: "指导价",
      data: [0, 0, 0]
    }
  ]
})

function getDateRangeList() {
  const today = dayjs();
  const dateList = [];

  for (let i = 6; i >= 0; i--) {
    const date = today.subtract(i, 'day');
    dateList.push(date.format('M月D日')); // 格式化为 '5月7日'
  }
  return dateList;
}


</script>


<style scoped lang="scss">

</style>
