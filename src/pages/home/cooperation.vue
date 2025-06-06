<template>
  <view style="padding: 50rpx">
    <uv-toast ref="toast"></uv-toast>
    <view style="text-align: center;font-size: 40rpx">商业合作登记</view>
    <uv-form labelPosition="top" :model="coopRegister" :rules="rules" ref="form">
      <uv-form-item label-width="auto" label="公司名称" prop="companyName">
        <uv-input v-model="coopRegister.companyName">
        </uv-input>
      </uv-form-item>
      <uv-form-item label-width="auto" label="联系人名称" prop="contactName">
        <uv-input v-model="coopRegister.contactName">
        </uv-input>
      </uv-form-item>
      <uv-form-item label-width="auto" label="联系方式" prop="contactInfo">
        <uv-input v-model="coopRegister.contactInfo">
        </uv-input>
      </uv-form-item>
      <uv-form-item label-width="auto" label="职位" prop="jobTitle">
        <uv-input v-model="coopRegister.jobTitle">
        </uv-input>
      </uv-form-item>
      <uv-form-item label-width="auto" label="合作意向简述" prop="cooperationNote">
        <uv-input v-model="coopRegister.cooperationNote">
        </uv-input>
      </uv-form-item>
      <uv-form-item label-width="auto" label="推荐人" prop="referrer">
        <uv-input v-model="coopRegister.referrer">
        </uv-input>
      </uv-form-item>
      <uv-button type="primary" text="提交" customStyle="margin-top: 10px" @click="submit"></uv-button>
      <uv-button type="error" text="重置" customStyle="margin-top: 10px" @click="reset"></uv-button>
    </uv-form>
  </view>
</template>

<script setup lang="ts">
import {isSuccess} from "../../utils/httpUtils";
import {ref} from "vue";
import {baseUrl} from "../../utils/urlUtils";
import {onShareAppMessage} from "@dcloudio/uni-app";

onShareAppMessage(() => {
  return {
    title: '盛菲商业合作',
    path: `/pages/home/cooperation`,
    imageUrl: baseUrl + '/file/swiper-1-compressed.png'
  }
})

const toast = ref(null);

const coopRegister = ref(
    {
      companyName: '',
      contactName: '',
      contactInfo: '',
      jobTitle: '',
      cooperationNote: '',
      referrer: '',
    }
)

const rules = ref({
  'companyName': {
    type: 'string',
    required: true,
    min: 1,
    max: 100,
    message: '请填写公司名称',
    trigger: ['blur', 'change']
  },
  'contactName': {
    type: 'string',
    required: true,
    min: 1,
    max: 20,
    message: '请填写联系人名称',
    trigger: ['blur', 'change']
  },
  'contactInfo': {
    type: 'string',
    required: true,
    min: 1,
    max: 50,
    message: '请填写联系方式',
    trigger: ['blur', 'change']
  },
  'jobTitle': {
    type: 'string',
    required: true,
    min: 1,
    max: 20,
    message: '请填写职位',
    trigger: ['blur', 'change']
  },
  'cooperationNote': {
    type: 'string',
    required: true,
    min: 1,
    max: 1000,
    message: '请填写合作意向简述',
    trigger: ['blur', 'change']
  },
  'referrer': {
    type: 'string',
    required: false,
    min: 1,
    max: 100,
    message: '推荐人过长',
    trigger: ['blur', 'change']
  },
})

const form = ref(null)

function submit() {
  form.value.validate().then(res => {
    uni.request({
      url: baseUrl + '/app/coop-register',
      method: 'POST',
      data: coopRegister.value,
      success: (res) => {
        if (!isSuccess(res.data)) {
          toast.value.show({
            type: 'error',
            message: '提交失败',
          })
        } else {
          toast.value.show({
            type: 'success',
            message: '提交成功',
            complete: () => {
              uni.switchTab({
                url: `/pages/home/home`
              })
            }
          })
        }
        reset()

      },
      fail: (res) => {
        notify.value.error(res.data.data.message)
      },
    })
  })
}

function reset() {
  form.value.resetFields()
  form.value.clearValidate()
}

</script>


<style scoped lang="scss">
</style>
