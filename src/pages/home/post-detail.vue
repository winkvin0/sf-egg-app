<template>
  <view class="post-page">
    <app-safe-area back />

    <view class="article-card">
      <view class="article-title">{{ post.title || '盛菲文章' }}</view>
      <view class="article-meta">{{ formatDate(post.createTime) }} · 浏览 {{ post.viewCount || 0 }}</view>
      <rich-text class="article-content" :nodes="post.content"></rich-text>
    </view>
  </view>
</template>

<script setup>
import {onLoad, onShareAppMessage} from "@dcloudio/uni-app";
import {ref} from "vue";
import {processImgTags} from "../../utils/htmlUtils";
import {baseUrl} from "../../utils/urlUtils";
import {requestBusinessData} from "../../utils/httpUtils";
import {formatDate} from "../../utils/appUtils";
import {buildPostSharePath, normalizeShareTitle, resolveShareImage, SHARE_IMAGES} from "../../utils/shareUtils";

const post = ref({})
const postId = ref('');

function getPost(id) {
  requestBusinessData({
    url: baseUrl + `/post/published/${id}`,
    method: 'GET'
  }, {}).then(data => {
    data.content = processImgTags(data.content || '');
    post.value = data;
  })
}

onLoad((option) => {
  postId.value = option.id || '';
  if (postId.value) {
    getPost(postId.value)
  }
})

onShareAppMessage(() => {
  return {
    title: normalizeShareTitle(post.value.title, '公司文章'),
    path: buildPostSharePath(post.value.id || postId.value),
    imageUrl: resolveShareImage(post.value.thumbnails, SHARE_IMAGES.post)
  }
})

</script>

<style scoped lang="scss">
.post-page {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 0 30rpx 42rpx;
  background: #f7f8f3;
  color: #18221d;
}

.article-card {
  box-sizing: border-box;
  padding: 32rpx 28rpx;
  border: 2rpx solid #e1e8df;
  border-radius: 34rpx;
  background: #ffffff;
}

.article-title {
  font-size: 40rpx;
  line-height: 52rpx;
  font-weight: 900;
  color: #1c251f;
}

.article-meta {
  margin-top: 12rpx;
  padding-bottom: 24rpx;
  border-bottom: 2rpx solid #edf1ea;
  font-size: 24rpx;
  line-height: 34rpx;
  color: #8b9791;
}

.article-content {
  display: block;
  margin-top: 28rpx;
  width: 100%;
  font-size: 28rpx;
  line-height: 46rpx;
  color: #303b35;
}
</style>
