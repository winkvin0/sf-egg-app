<template>
  <uv-toast ref="toast"></uv-toast>
  <view
      style="display: flex;flex-direction: column;justify-content: center;align-items: center;height: 80vh;gap:70rpx">
    <view style="display: flex; gap: 50rpx;justify-content: center;align-items: center">
      <image src="/static/app-logo-3.png" style="width:120rpx;height: 120rpx"></image>
    </view>
    <view style="display: flex;justify-content: center;align-items: center">
      <uv-checkbox-group v-model="checkboxList">
        <uv-checkbox label="" name="agree"></uv-checkbox>
      </uv-checkbox-group>
      <view style="display: flex; font-size: 25rpx">
        请先阅读并同意
        <view style="color: #007aff" @click="toPrivacy">《用户隐私协议》</view>
      </view>
    </view>
    <uv-button v-if="checkboxList.length === 0" size="large" custom-style="border-radius:20rpx" type="success"
               @click="openTips">手机号快捷登录
    </uv-button>
    <uv-button v-else size="large" custom-style="border-radius:20rpx" open-type="getPhoneNumber"
               @getphonenumber="onGetPhoneNumber" type="success">手机号快捷登录
    </uv-button>
  </view>
</template>

<script setup>

import {ref} from "vue";
import {isSuccess, parseCookie, request} from "../../utils/httpUtils";
import {baseUrl} from "../../utils/urlUtils";

const checkboxList = ref([])

const toast = ref(null)

function toPrivacy() {
  wx.openPrivacyContract({})
}

async function openTips() {
  toast.value.show({
    type: "default",
    message: "请先阅读并同意用户隐私协议",
  })
}

async function onGetPhoneNumber(e) {
  toast.value.show({
    type: 'loading',
    message: '正在加载',
    duration: 100000
  })
  try {
    const resp = await request({
      url: baseUrl + '/auth/wx/link',
      method: 'POST',
      data: e.code,
      header: {
        'Cookie': 'satoken=' + uni.getStorageSync('satoken')
      }
    });
    // 如果关联成功，替换token
    const cookie = parseCookie(resp.header['Set-Cookie']);
    if (!isSuccess(resp.data) || !cookie['satoken']) {
      toast.value.show({
        type: "error",
        message: '登录失败'
      })
      return;
    }
    uni.setStorageSync('satoken', cookie['satoken']);
    await uni.switchTab({
      url: `/pages/my/my`
    })
  } catch (error) {
    toast.value.show({
      type: "error",
      message: '登录失败',
    })
  }
}


</script>


<style scoped lang="scss">

</style>
