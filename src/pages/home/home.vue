<template>
  <view>
    <uv-swiper :list="swiperList" height="220"></uv-swiper>

    <!-- Top Banner -->
    <uv-tabs :list="tabsList" :scrollable="false" :current="tabIdx" @change="tabChange"></uv-tabs>

    <view v-if="tabIdx === 0">
      <z-paging ref="paging" v-model="posts" @query="getPosts" :use-page-scroll="true">
        <view style="padding: 20rpx;">
          <template v-for="(post,index) in posts">
            <view class="post" @click="toDetail(post.id)">
              <view style="display: flex;">
                <view style="display: flex; flex-direction: column; flex: 550rpx">
                  <view class="post-text">
                    <uv-text :lines="1" size="15" :text="post.title"></uv-text>
                  </view>
                  <view class="post-text">
                    <uv-text :lines="3" size="12" :text="post.textContent"></uv-text>
                  </view>
                </view>
                <uv-image v-if="post.thumbnails" width="120" height="70" radius="5" :src="post.thumbnails"></uv-image>
              </view>

              <view class="post-button">
                <view>{{ dayjs(post.createTime).format('YYYY-MM-DD') }}</view>
                <view style="display: flex">
                  <view style="display: flex;margin-right: 10rpx;">
                    <uv-icon name="eye" color="#909193"></uv-icon>
                    <view>{{ post.viewCount }}</view>
                  </view>

                  <view style="display: flex">
                    <uv-icon name="share" color="#909193"></uv-icon>
                    <view>分享</view>
                  </view>

                </view>
              </view>
            </view>
            <uv-line :custom-style="{margin:'15rpx 0'}" v-if="index !== posts.length-1"></uv-line>
          </template>

        </view>
      </z-paging>
    </view>
    <view v-if="tabIdx === 1">
      <rich-text style="font-size: small" :nodes="intro">

      </rich-text>
    </view>
  </view>
</template>

<script setup>
import {ref} from 'vue';
import {onLoad, onPageScroll, onReachBottom, onShareAppMessage, onShow} from "@dcloudio/uni-app";
import dayjs from "dayjs";
import {processImgTags} from "../../utils/htmlUtils";
import {baseUrl} from "../../utils/urlUtils";

const intro = ref('')

onLoad(() => {
  uni.request({
    url: baseUrl + '/app/config/intro',
    method: 'GET',
    success: (res) => {
      intro.value = res.data.data
      intro.value = processImgTags(intro.value);
    }
  })
})

onShow(() => {
  tabIdx.value = 0
})

onShareAppMessage(() => {
  return {
    title: '盛菲蛋业',
    path: '/pages/home/home',
    imageUrl: baseUrl + '/file/swiper-1-compressed.png'
  }
})


const swiperList = ref([
  baseUrl + '/file/swiper-1-compressed.png'
])

const tabsList = ref([{
  name: '公司发文'
}, {
  name: '公司介绍'
}, {
  name: '商业合作'
},])
const tabIdx = ref(0);

function tabChange(item) {
  if (item.index === 2) {
    uni.navigateTo({
      url: `/pages/home/cooperation`
    })
  }
  tabIdx.value = item.index

}

const posts = ref([])

function getPosts(pageNo, pageSize) {
  uni.request({
    url: baseUrl + '/app/post/page',
    method: 'POST',
    data: {
      page: pageNo,
      size: pageSize
    },
    success: (res) => {
      paging.value.complete(res.data.data)
    }
  })
}

const paging = ref(null)
onPageScroll((e) => {
  paging.value.updatePageScrollTop(e.scrollTop)
})

onReachBottom(() => {
  paging.value.pageReachBottom()
})

function toDetail(id) {
  uni.navigateTo({
    url: `/pages/home/post-detail?id=${id}`
  })
}
</script>

<style scoped lang="scss">
@import "@climblee/uv-ui/theme.scss";

.post {
  height: 200rpx;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.post-text {
  margin-bottom: 10rpx;
}

.post-button {
  display: flex;
  justify-content: space-between;
  font-size: 22rpx;
  color: $uv-tips-color;
}
</style>
