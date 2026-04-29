<template>
  <view class="trend-page">
    <app-safe-area back />

    <view class="trend-hero">
      <view class="hero-top">
        <view>
          <view class="eyebrow">蛋价走势</view>
          <view class="hero-title">{{ regionName }}</view>
        </view>
        <view class="hero-note">近7日</view>
      </view>

    </view>

    <view class="region-switcher">
      <view
          v-for="area in areaList"
          :key="area.code"
          class="region-pill"
          :class="{ active: regionCode === area.code }"
          @click="regionCode = area.code"
      >
        {{ area.name }}
      </view>
    </view>

    <view class="size-section">
      <view class="filter-head">
        <view class="filter-title">选择码数</view>
        <view class="filter-value">{{ size }}码</view>
      </view>
      <scroll-view class="size-scroll" scroll-x enable-flex :show-scrollbar="false">
        <view class="size-list">
          <view
              v-for="item in sizeList"
              :key="item"
              class="size-pill"
              :class="{ active: size === item }"
              @click="size = item"
          >
            {{ item }}码
          </view>
        </view>
      </scroll-view>
    </view>

    <view class="chart-card">
      <view class="chart-head">
        <view>
          <view class="chart-title">近7日指导价</view>
          <view class="chart-subtitle">{{ size }}码，无数据日期按 0 展示</view>
        </view>
        <view class="legend-row">
          <view class="legend-item"><view class="legend-dot pink"></view><text>粉蛋</text></view>
          <view class="legend-item"><view class="legend-dot red"></view><text>红蛋</text></view>
        </view>
      </view>
      <view class="chart-wrap">
        <canvas
            id="dailyTrendChart"
            canvas-id="dailyTrendChart"
            class="chart-canvas"
        />
      </view>
    </view>

    <view class="chart-card">
      <view class="chart-head">
        <view>
          <view class="chart-title">价格对比</view>
          <view class="chart-subtitle">{{ size }}码，每个地区展示粉蛋/红蛋两组柱</view>
        </view>
        <view class="legend-row light">
          <view class="legend-item"><view class="legend-dot pink"></view><text>粉蛋</text></view>
          <view class="legend-item"><view class="legend-dot red"></view><text>红蛋</text></view>
        </view>
      </view>
      <view class="chart-wrap column">
        <canvas
            id="regionTrendChart"
            canvas-id="regionTrendChart"
            class="chart-canvas"
        />
      </view>
    </view>
  </view>
</template>

<script setup>
import {computed, getCurrentInstance, nextTick, ref, watch} from "vue";
import {onLoad, onShareAppMessage, onShow} from "@dcloudio/uni-app";
import dayjs from "dayjs";
import {baseUrl} from "../../utils/urlUtils";
import {requestBusinessData} from "../../utils/httpUtils";
import {DEFAULT_EGG_PRICE_SIZES, EGG_PRICE_REGIONS} from "../../utils/eggPriceUtils";

const areaList = EGG_PRICE_REGIONS;
const eggTypes = [
  {name: '粉蛋', type: 'PINK'},
  {name: '红蛋', type: 'RED'},
];

const size = ref(45);
const sizeList = DEFAULT_EGG_PRICE_SIZES;
const regionCode = ref('4406');
const dailyTrendData = ref(buildDailyTrendData());
const regionTrendData = ref(buildRegionTrendData());
const instance = getCurrentInstance();

onLoad((options) => {
  if (options.regionCode && areaList.some(item => item.code === options.regionCode)) {
    regionCode.value = options.regionCode;
  }
  if (Number.isFinite(Number(options.size)) && Number(options.size) > 0) {
    size.value = Number(options.size);
  }
})

onShow(() => {
  syncTrendData();
})

watch([regionCode, size], () => {
  syncTrendData();
})

onShareAppMessage(() => {
  return {
    title: '今日蛋价',
    path: `/pages/price/price`,
    imageUrl: baseUrl + '/file/swiper-1-compressed.png'
  }
})

const regionName = computed(() => {
  const area = areaList.find(item => item.code === regionCode.value);
  return area ? area.name : '佛山';
})

async function syncTrendData() {
  const [pinkDaily, redDaily, pinkRegion, redRegion] = await Promise.all([
    requestDailyTrend('PINK'),
    requestDailyTrend('RED'),
    requestRegionTrend('PINK'),
    requestRegionTrend('RED'),
  ]);

  dailyTrendData.value = buildDailyTrendData(pinkDaily, redDaily);
  regionTrendData.value = buildRegionTrendData(pinkRegion, redRegion);
  nextTick(drawCharts);
}

function requestDailyTrend(eggType) {
  return requestTrend({
    url: baseUrl + '/egg/price/daily/trend',
    data: {
      regionCode: regionCode.value,
      size: size.value,
      eggType,
      dateRange: [dayjs().subtract(6, 'day').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')],
    },
    fallback: Array(7).fill(0),
  });
}

function requestRegionTrend(eggType) {
  return requestTrend({
    url: baseUrl + '/egg/price/region/trend',
    data: {
      size: size.value,
      eggType,
      regionCodes: areaList.map(item => item.code),
    },
    fallback: Array(3).fill(0),
  });
}

async function requestTrend({url, data, fallback}) {
  const responseData = await requestBusinessData({
    url,
    method: 'POST',
    data,
  }, fallback);
  return Array.isArray(responseData) ? responseData : fallback;
}

function buildDailyTrendData(pinkData = [], redData = []) {
  return {
    categories: getDateRangeList(),
    series: [
      {name: eggTypes[0].name, data: normalizeChartData(pinkData, 7)},
      {name: eggTypes[1].name, data: normalizeChartData(redData, 7)},
    ]
  };
}

function buildRegionTrendData(pinkData = [], redData = []) {
  return {
    categories: areaList.map(item => item.name),
    series: [
      {name: eggTypes[0].name, data: normalizeChartData(pinkData, 3)},
      {name: eggTypes[1].name, data: normalizeChartData(redData, 3)},
    ]
  };
}

function normalizeChartData(data, length) {
  const list = Array.isArray(data) ? data : [];
  return Array.from({length}, (_, index) => {
    const value = Number(list[index]);
    return Number.isFinite(value) ? value : 0;
  })
}

function getDateRangeList() {
  return Array.from({length: 7}, (_, index) => {
    return dayjs().subtract(6 - index, 'day').format('M/D');
  })
}

function drawCharts() {
  drawLineChart('dailyTrendChart', dailyTrendData.value);
  drawColumnChart('regionTrendChart', regionTrendData.value);
}

function drawLineChart(canvasId, chartData) {
  measureCanvas(canvasId, (width, height) => {
    const context = uni.createCanvasContext(canvasId, instance?.proxy);
    const categories = chartData.categories || [];
    const series = chartData.series || [];
    const values = series.flatMap(item => item.data || []).map(Number).filter(Number.isFinite);
    const axisMax = getAxisMax(values);
    const padding = {top: 34, right: 18, bottom: 28, left: 42};
    const chartWidth = Math.max(width - padding.left - padding.right, 1);
    const chartHeight = Math.max(height - padding.top - padding.bottom, 1);

    clearChart(context, width, height);
    drawAxes(context, width, height, padding, axisMax, '#d7ded8', '#7c8881');
    drawCategoryLabels(context, categories, padding, chartWidth, height);

    const lineSeriesList = series.map(item => {
      return normalizeChartData(item.data, categories.length).map((value, index) => ({
        value,
        x: padding.left + chartWidth * index / Math.max(categories.length - 1, 1),
        y: padding.top + chartHeight * (1 - Number(value) / axisMax)
      }));
    });

    lineSeriesList.forEach((points, seriesIndex) => {
      const color = seriesIndex === 0 ? '#f4c84f' : '#1e6b52';
      context.setStrokeStyle(color);
      context.setLineWidth(3);
      context.setLineCap('round');
      context.setLineJoin('round');
      context.beginPath();
      points.forEach((point, index) => {
        if (index === 0) {
          context.moveTo(point.x, point.y);
        } else {
          context.lineTo(point.x, point.y);
        }
      });
      context.stroke();
      context.setFillStyle(color);
      points.forEach(point => {
        context.beginPath();
        context.arc(point.x, point.y, 3, 0, Math.PI * 2);
        context.fill();
      });
    });

    drawLinePointLabels(context, lineSeriesList, {
      left: padding.left,
      right: width - padding.right,
      top: 8,
      bottom: height - padding.bottom,
    });

    context.draw();
  });
}

function drawLinePointLabels(context, lineSeriesList, bounds) {
  context.setFontSize(11);
  context.setTextAlign('center');
  context.setTextBaseline('middle');

  const occupiedBoxes = [];
  const lineSegments = getLineSegments(lineSeriesList);
  const labels = getLinePointLabels(lineSeriesList);

  labels.forEach(labelItem => {
    const position = getPointLabelPosition(labelItem, lineSeriesList, lineSegments, occupiedBoxes, bounds);
    if (!position) {
      return;
    }

    const box = getLabelBox(labelItem.label, position.x, position.y);
    occupiedBoxes.push(box);
    drawValueLabel(context, labelItem.label, position.x, position.y, labelItem.textColor);
  });
}

function getLinePointLabels(lineSeriesList) {
  return lineSeriesList.flatMap((points, seriesIndex) => {
    return points.map((point, index) => {
      if (isZeroChartValue(point.value)) {
        return null;
      }

      const label = formatPointLabel(point.value);
      const textColor = seriesIndex === 0 ? '#7a4e00' : '#1e6b52';
      return {
        ...point,
        index,
        seriesIndex,
        label,
        textColor,
        priority: getPointLabelPriority(index, points.length),
      };
    }).filter(Boolean);
  }).sort((first, second) => {
    if (first.priority !== second.priority) {
      return second.priority - first.priority;
    }
    if (first.index !== second.index) {
      return first.index - second.index;
    }
    return Number(second.value) - Number(first.value);
  });
}

function getPointLabelPriority(index, length) {
  if (index === length - 1) {
    return 4;
  }
  if (index === 0) {
    return 3;
  }
  return 1;
}

function drawColumnChart(canvasId, chartData) {
  measureCanvas(canvasId, (width, height) => {
    const context = uni.createCanvasContext(canvasId, instance?.proxy);
    const categories = chartData.categories || [];
    const series = chartData.series || [];
    const values = series.flatMap(item => item.data || []).map(Number).filter(Number.isFinite);
    const axisMax = getAxisMax(values);
    const padding = {top: 34, right: 12, bottom: 30, left: 42};
    const chartWidth = Math.max(width - padding.left - padding.right, 1);
    const chartHeight = Math.max(height - padding.top - padding.bottom, 1);
    const groupWidth = chartWidth / Math.max(categories.length, 1);
    const barWidth = Math.min(16, Math.max(8, groupWidth * 0.18));
    const gap = Math.max(5, groupWidth * 0.06);

    clearChart(context, width, height);
    drawAxes(context, width, height, padding, axisMax, '#edf1ea', '#8b9791');
    drawCategoryLabels(context, categories, padding, chartWidth, height);

    categories.forEach((_, categoryIndex) => {
      const centerX = padding.left + groupWidth * categoryIndex + groupWidth / 2;
      series.forEach((item, seriesIndex) => {
        const value = Number(item.data?.[categoryIndex]) || 0;
        const barHeight = chartHeight * value / axisMax;
        const x = centerX + (seriesIndex === 0 ? -barWidth - gap / 2 : gap / 2);
        const y = padding.top + chartHeight - barHeight;
        const color = seriesIndex === 0 ? '#ffd365' : '#1e6b52';
        context.setFillStyle(color);
        context.fillRect(x, y, barWidth, Math.max(barHeight, value > 0 ? 2 : 0));
        drawBarLabel(context, value, x + barWidth / 2, y, seriesIndex);
      });
    });

    context.draw();
  });
}

function drawBarLabel(context, value, x, y, seriesIndex) {
  if (isZeroChartValue(value)) {
    return;
  }

  const labelY = Math.max(10, y - 12);
  const textColor = seriesIndex === 0 ? '#7a4e00' : '#1e6b52';
  drawValueLabel(context, formatPointLabel(value), x, labelY, textColor);
}

function getPointLabelPosition(labelItem, lineSeriesList, lineSegments, occupiedBoxes, bounds) {
  const candidates = getPointLabelCandidates(labelItem, lineSeriesList, bounds);

  for (const position of candidates) {
    const box = getLabelBox(labelItem.label, position.x, position.y);
    if (isReadableLabelBox(box, lineSegments, occupiedBoxes)) {
      return position;
    }
  }

  return null;
}

function getPointLabelCandidates(labelItem, lineSeriesList, bounds) {
  const primaryDirection = getPointLabelDirection(labelItem, lineSeriesList);
  const directions = [primaryDirection, -primaryDirection];
  const offsets = [14, 18, 22, 28, 34, 42];
  const xOffsets = [0, -8, 8, -14, 14, -22, 22];
  const seen = new Set();

  return directions.flatMap(direction => {
    return offsets.flatMap(offset => {
      return xOffsets.map(xOffset => {
        const position = clampLabelPosition(
            labelItem.x + xOffset,
            labelItem.y + direction * offset,
            labelItem.label,
            bounds,
        );
        return {
          ...position,
          key: `${Math.round(position.x)}-${Math.round(position.y)}`,
          score: getLabelCandidateScore(labelItem, position, direction, primaryDirection, xOffset),
        };
      });
    });
  }).filter(position => {
    if (seen.has(position.key)) {
      return false;
    }
    seen.add(position.key);
    return true;
  }).sort((first, second) => first.score - second.score);
}

function getLabelCandidateScore(labelItem, position, direction, primaryDirection, xOffset) {
  const distanceX = Math.abs(position.x - labelItem.x);
  const distanceY = Math.abs(position.y - labelItem.y);
  const directionPenalty = direction === primaryDirection ? 0 : 8;
  return distanceY + distanceX * 1.4 + Math.abs(xOffset) * 0.4 + directionPenalty;
}

function getPointLabelDirection(labelItem, lineSeriesList) {
  const sameIndexPoints = lineSeriesList
      .map(points => points[labelItem.index])
      .filter(point => point && !isZeroChartValue(point.value));

  if (sameIndexPoints.length > 1) {
    const maxValue = Math.max(...sameIndexPoints.map(point => Number(point.value)));
    const minValue = Math.min(...sameIndexPoints.map(point => Number(point.value)));
    if (Math.abs(maxValue - minValue) > 0.001) {
      return Math.abs(Number(labelItem.value) - maxValue) < 0.001 ? -1 : 1;
    }
  }

  return labelItem.seriesIndex === 0 ? -1 : 1;
}

function clampLabelPosition(x, y, label, bounds) {
  const boxWidth = getLabelWidth(label);
  const halfWidth = boxWidth / 2;
  const halfHeight = 7;
  return {
    x: Math.min(Math.max(x, bounds.left + halfWidth), bounds.right - halfWidth),
    y: Math.min(Math.max(y, bounds.top + halfHeight), bounds.bottom - halfHeight),
  };
}

function getLabelBox(label, x, y) {
  const halfWidth = getLabelWidth(label) / 2 + 3;
  const halfHeight = 8;
  return {
    left: x - halfWidth,
    right: x + halfWidth,
    top: y - halfHeight,
    bottom: y + halfHeight,
  };
}

function getLabelWidth(label) {
  return String(label).length * 6.5;
}

function isReadableLabelBox(box, lineSegments, occupiedBoxes) {
  const paddedBox = padBox(box, 1);
  return !lineSegments.some(([start, end]) => {
    return isSegmentIntersectingBox(start, end, paddedBox);
  }) && !occupiedBoxes.some(occupiedBox => {
    return isBoxOverlappingBox(paddedBox, occupiedBox);
  });
}

function getLineSegments(lineSeriesList) {
  return lineSeriesList.flatMap(points => {
    return points.slice(0, -1).map((point, index) => [point, points[index + 1]]);
  });
}

function padBox(box, padding) {
  return {
    left: box.left - padding,
    right: box.right + padding,
    top: box.top - padding,
    bottom: box.bottom + padding,
  };
}

function isBoxOverlappingBox(first, second) {
  return first.left < second.right
      && first.right > second.left
      && first.top < second.bottom
      && first.bottom > second.top;
}

function isSegmentIntersectingBox(start, end, box) {
  if (isPointInBox(start, box) || isPointInBox(end, box)) {
    return true;
  }

  const corners = [
    {x: box.left, y: box.top},
    {x: box.right, y: box.top},
    {x: box.right, y: box.bottom},
    {x: box.left, y: box.bottom},
  ];
  return corners.some((corner, index) => {
    const nextCorner = corners[(index + 1) % corners.length];
    return isSegmentIntersectingSegment(start, end, corner, nextCorner);
  });
}

function isPointInBox(point, box) {
  return point.x >= box.left && point.x <= box.right && point.y >= box.top && point.y <= box.bottom;
}

function isSegmentIntersectingSegment(a, b, c, d) {
  const ab = getOrientation(a, b, c);
  const ac = getOrientation(a, b, d);
  const cd = getOrientation(c, d, a);
  const ca = getOrientation(c, d, b);

  if (ab === 0 && isPointOnSegment(c, a, b)) return true;
  if (ac === 0 && isPointOnSegment(d, a, b)) return true;
  if (cd === 0 && isPointOnSegment(a, c, d)) return true;
  if (ca === 0 && isPointOnSegment(b, c, d)) return true;

  return ab !== ac && cd !== ca;
}

function getOrientation(a, b, c) {
  const value = (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);
  if (Math.abs(value) < 0.001) {
    return 0;
  }
  return value > 0 ? 1 : 2;
}

function isPointOnSegment(point, start, end) {
  return point.x <= Math.max(start.x, end.x)
      && point.x >= Math.min(start.x, end.x)
      && point.y <= Math.max(start.y, end.y)
      && point.y >= Math.min(start.y, end.y);
}

function drawValueLabel(context, text, x, y, textColor) {
  context.setFontSize(11);
  context.setTextAlign('center');
  context.setTextBaseline('middle');
  context.setFillStyle(textColor);
  context.fillText(text, x, y);
}

function measureCanvas(canvasId, callback) {
  const query = uni.createSelectorQuery().in(instance?.proxy);
  query.select(`#${canvasId}`).boundingClientRect(rect => {
    if (!rect || !rect.width || !rect.height) {
      return;
    }
    callback(rect.width, rect.height);
  }).exec();
}

function clearChart(context, width, height) {
  context.clearRect(0, 0, width, height);
  context.setFillStyle('#ffffff');
  context.fillRect(0, 0, width, height);
}

function drawAxes(context, width, height, padding, axisMax, gridColor, labelColor) {
  const chartHeight = Math.max(height - padding.top - padding.bottom, 1);
  context.setFontSize(11);
  context.setTextAlign('right');
  context.setTextBaseline('middle');

  [axisMax, axisMax / 2, 0].forEach(value => {
    const y = padding.top + chartHeight * (1 - value / axisMax);
    context.setStrokeStyle(gridColor);
    context.setLineWidth(1);
    context.setLineDash([3, 3], 0);
    context.beginPath();
    context.moveTo(padding.left, y);
    context.lineTo(width - padding.right, y);
    context.stroke();
    context.setFillStyle(labelColor);
    context.fillText(formatAxisLabel(value), padding.left - 6, y);
  });

  context.setLineDash([], 0);
  context.setStrokeStyle(gridColor);
  context.beginPath();
  context.moveTo(padding.left, padding.top);
  context.lineTo(padding.left, height - padding.bottom);
  context.lineTo(width - padding.right, height - padding.bottom);
  context.stroke();
}

function drawCategoryLabels(context, categories, padding, chartWidth, height) {
  context.setTextAlign('center');
  context.setTextBaseline('top');
  context.setFillStyle('#8b9791');
  context.setFontSize(11);
  categories.forEach((label, index) => {
    const x = padding.left + chartWidth * index / Math.max(categories.length - 1, 1);
    context.fillText(label || '', x, height - padding.bottom + 10);
  });
}

function getAxisMax(values) {
  const maxValue = Math.max(1, ...values);
  return Math.ceil(maxValue / 10) * 10 || 10;
}

function formatAxisLabel(value) {
  if (Math.abs(value - Math.round(value)) < 0.01) {
    return String(Math.round(value));
  }
  return value.toFixed(1);
}

function formatPointLabel(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return '0';
  }
  if (Math.abs(parsed - Math.round(parsed)) < 0.01) {
    return String(Math.round(parsed));
  }
  return parsed.toFixed(2);
}

function isZeroChartValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && Math.abs(parsed) < 0.001;
}
</script>

<style scoped lang="scss">
.trend-page {
  width: 100vw;
  max-width: 100vw;
  min-height: 100vh;
  box-sizing: border-box;
  overflow-x: hidden;
  padding: 0 28rpx 36rpx;
  background: #f7f8f3;
  color: #18221d;
}

.trend-hero {
  box-sizing: border-box;
  padding: 28rpx 30rpx;
  border-radius: 36rpx;
  background: #1e6b52;
}

.hero-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  min-width: 0;
}

.hero-top > view:first-child {
  min-width: 0;
}

.eyebrow {
  font-size: 24rpx;
  line-height: 32rpx;
  font-weight: 800;
  color: #ffd365;
}

.hero-title {
  margin-top: 6rpx;
  font-size: 38rpx;
  line-height: 48rpx;
  font-weight: 900;
  color: #ffffff;
}

.hero-note {
  flex: 0 0 auto;
  min-width: 112rpx;
  height: 64rpx;
  padding: 0 22rpx;
  border-radius: 32rpx;
  line-height: 64rpx;
  text-align: center;
  font-size: 24rpx;
  font-weight: 900;
  color: #1e6b52;
  background: #ffd365;
}

.region-switcher {
  display: flex;
  gap: 8rpx;
  margin-top: 18rpx;
  padding: 4rpx;
  border: 2rpx solid #e1e8df;
  border-radius: 40rpx;
  background: #ffffff;
  max-width: 100%;
  box-sizing: border-box;
}

.region-pill {
  flex: 1;
  height: 64rpx;
  border-radius: 32rpx;
  text-align: center;
  line-height: 64rpx;
  font-size: 26rpx;
  font-weight: 800;
  color: #5d6a63;
}

.region-pill.active {
  color: #ffffff;
  background: #1e6b52;
}

.size-section {
  margin-top: 18rpx;
  box-sizing: border-box;
  padding: 20rpx 22rpx;
  border: 2rpx solid #e1e8df;
  border-radius: 34rpx;
  background: #ffffff;
  max-width: 100%;
}

.filter-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.filter-title {
  font-size: 28rpx;
  line-height: 36rpx;
  font-weight: 900;
  color: #1c251f;
}

.filter-value {
  flex: 0 0 auto;
  min-width: 84rpx;
  height: 44rpx;
  padding: 0 18rpx;
  border-radius: 22rpx;
  line-height: 44rpx;
  text-align: center;
  font-size: 22rpx;
  font-weight: 900;
  color: #7a5b12;
  background: #fff2c7;
}

.size-scroll {
  width: 100%;
  margin-top: 16rpx;
  white-space: nowrap;
}

.size-list {
  display: inline-flex;
  gap: 12rpx;
  min-width: 100%;
}

.size-pill {
  flex: 0 0 auto;
  box-sizing: border-box;
  min-width: 92rpx;
  height: 56rpx;
  padding: 0 18rpx;
  border: 2rpx solid #e1e8df;
  border-radius: 28rpx;
  line-height: 52rpx;
  text-align: center;
  font-size: 24rpx;
  font-weight: 800;
  color: #5d6a63;
  background: #fbfcf8;
}

.size-pill.active {
  border-color: #1e6b52;
  color: #ffffff;
  background: #1e6b52;
}

.chart-card {
  margin-top: 18rpx;
  box-sizing: border-box;
  padding: 22rpx;
  border: 2rpx solid #e1e8df;
  border-radius: 34rpx;
  background: #ffffff;
  max-width: 100%;
}

.chart-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
  min-width: 0;
}

.chart-head > view:first-child {
  min-width: 0;
}

.chart-title {
  font-size: 30rpx;
  line-height: 38rpx;
  font-weight: 900;
  color: #1c251f;
}

.chart-subtitle {
  margin-top: 6rpx;
  font-size: 22rpx;
  line-height: 30rpx;
  color: #7a8780;
}

.legend-row {
  display: flex;
  align-items: center;
  gap: 14rpx;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6rpx;
  font-size: 22rpx;
  line-height: 30rpx;
  font-weight: 800;
  color: #5d6a63;
}

.legend-dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
}

.legend-dot.pink {
  background: #f4c84f;
}

.legend-dot.red {
  background: #1e6b52;
}

.chart-wrap {
  height: 360rpx;
  margin-top: 16rpx;
  overflow: hidden;
  border-radius: 24rpx;
  background: #ffffff;
}

.chart-wrap.column {
  height: 340rpx;
  background: #ffffff;
}

.chart-canvas {
  display: block;
  width: 100%;
  height: 100%;
  background: #ffffff;
}
</style>
