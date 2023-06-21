<script setup lang="ts">
import { 
  NModal, NCard, useMessage,
  NButton, NInput, NForm, NFormItem,
  type FormInst
} from 'naive-ui';
import { ref } from 'vue'
import ChatNav from '@/components/ChatNav/ChatNav.vue';
import ChatPromptStore from '@/components/ChatPromptStore/ChatPromptStore.vue';
import Chat from './components/Chat/Chat.vue';
const message = useMessage();
// 弹窗
const url = ref('https://fc-mp-fa7d97b0-49d8-409e-a902-fbfa876d91b0.next.bspapp.com')
const showTrialModal = ref(false); // 提醒试用
const showEmailModal = ref(false); // 提醒试用结束
const showTrialEndModal = ref(false); // 提醒试用结束
const showVipEndModal = ref(false); // 提醒会员到期
const networkerror = ref(false); // 网络错误

const formRef = ref<FormInst | null>(null)
const formValue = ref({ email: '' })
const rules = {
  email: { // 试用正则表达式验证邮箱
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    required: true,
    message: '请正确输入您的邮箱',
    trigger: ['input']
  }
}

declare global {
  interface Window {
    PAGE_EVENT_BUS: any;
  }
}

window.PAGE_EVENT_BUS.on('pageCheckUser', () => {
  console.log('pageCheckUser')
  newbingTrial();
});

const newbingTrial = () => {
  // 试用fetch向后端发送post请求
  fetch(url.value + '/api/newbingTrial', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userEmail: localStorage.userEmail,
    }),
  }).then((res) => res.json()).then((res) => {
    if (res.code === -1) {
      showTrialModal.value = true; // 提醒试用
    } else if (res.code == -2) {
      message.error('提醒试用结束');
      showTrialEndModal.value = true; // 提醒试用结束
    } else if (res.code == -99) {
      showVipEndModal.value = true; // 提醒会员到期
    }
  }).catch((err) => {
    console.log(err);
    networkerror.value = true; // 网络错误
  });
}

const getUserTrial = (e: MouseEvent) => {
  e.preventDefault()
  formRef.value?.validate((errors) => {
    if (!errors) {
      // fetch向后端发送post请求 
      fetch(url.value+'/api/newbingCreate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: formValue.value.email,
        }),
      }).then((res) => res.json()).then((res) => {
        if (res.code === 100) {
          showTrialModal.value = false;
          showEmailModal.value = false;
          localStorage.setItem('userEmail', formValue.value.email);
          message.success('领取成功，请直接开始会话！', { duration: 5000 });
        } else {
          message.error('领取失败');
        }
      }).catch((err) => {
        console.log(err);
        networkerror.value = true; // 网络错误
      });
    } else {
      console.log(errors)
    }
  })
}

setTimeout(() => {
  newbingTrial();
}, 3000);
</script>

<template>
  <main>
    <ChatNav />
    <ChatPromptStore />
    <Chat />
  </main>

  <n-modal v-model:show="showTrialModal">
    <n-card style="width: 600px" title="温馨提示" :bordered="false" size="huge" role="dialog" aria-modal="true">
      <!-- <template #header-extra>
        噢！
      </template> -->
        
      <div align="center" v-if="!showEmailModal">
        <p>免费试用提醒</p>
        <p>🎉 点击下方领取按钮，免费领取试用额度 🎉</p>
      </div>
      <n-form v-else ref="formRef" :label-width="80"
        :model="formValue" :rules="rules" :size="'medium'"
      >
        <n-form-item label="" path="email">
          <n-input v-model:value="formValue.email" placeholder="请输入您的邮箱，免费领取试用额度" />
        </n-form-item>
      </n-form>
      <template #footer>
        <div align="right">
          <n-button quaternary @click="showTrialModal = false">
            稍后提醒
          </n-button>
          &nbsp; &nbsp;
          <n-button v-if="!showEmailModal" type="primary" @click="showEmailModal = true">
            免费领取
          </n-button>
          <n-button v-else type="primary" @click="getUserTrial">
            立即领取
          </n-button>
        </div>
    </template>
    </n-card>
  </n-modal>
</template>
