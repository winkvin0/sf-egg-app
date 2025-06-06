<template>
  <view style="display: flex;flex-direction: column;justify-content: center;align-items: center; gap: 12rpx">
    <view style="font-size: 40rpx;">
      {{ post.title }}
    </view>
    <rich-text style="width: 100vw; font-size: small" :nodes="post.content"></rich-text>
  </view>
</template>

<script setup>
import {onLoad, onShareAppMessage} from "@dcloudio/uni-app";
import {ref} from "vue";
import {processImgTags} from "../../utils/htmlUtils";
import {baseUrl} from "../../utils/urlUtils";


const post = ref({})

function getPost(id) {
  uni.request({
    url: baseUrl + `/app/post/${id}`,
    method: 'GET',
    success: (res) => {
      post.value = res.data.data
      post.value.content = processImgTags(post.value.content)
    }
  })
}

onLoad((option) => {
  getPost(option.id)
})

onShareAppMessage(() => {
  return {
    title: '盛菲文章',
    path: `/pages/home/post-detail?id=${post.value.id}`,
    imageUrl: baseUrl + '/file/swiper-1-compressed.png'
  }
})

</script>


<style scoped lang="scss">

</style>
