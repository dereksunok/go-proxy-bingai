<script setup lang="ts">
import { 
  NModal, NCard, useMessage, NGradientText, NTable,
  NButton, NInput, NForm, NFormItem, NGrid, NGi, NAlert,
  type FormInst
} from 'naive-ui';
import type { MessageRenderMessage } from 'naive-ui'
import { ref, h } from 'vue'
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
const showVipLoginModal = ref(false); // 提醒会员登录
const expiredTime = ref(''); // 试用到期时间

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
let delayTimer: any = ref(null);

declare global {
  interface Window {
    PAGE_EVENT_BUS: any;
  }
}

window.PAGE_EVENT_BUS.on('pageCheckUser', () => {
  // console.log('pageCheckUser')
  newbingTrial();
});

const oldUserMessage = () => {
  const renderMessage: MessageRenderMessage = (props) => {
    return h(
      NAlert,
      {
        type: 'warning',
        closable: props.closable,
        onClose: props.onClose,
        title: '系统通知',
      },
      {
        default: () => props.content
      }
    )
  }
  // 右上角 弹出 message info 提醒老会员联系客服
  message.info('请2023-06-25前购买会员的用户，联系客服激活您的账号。', {
    render: renderMessage,
    closable: true,
    duration: 10000,
  });
}

const newbingTrial = (isLogin = '') => {
  let clearConversition = () => {
    // 清空会话
    if (delayTimer.value) clearTimeout(delayTimer.value)
    delayTimer.value = setTimeout(() => {
      let wp: any = document.querySelector('.cib-serp-main');
      if (!wp || !wp.shadowRoot) return;
      wp.shadowRoot.querySelector('#cib-action-bar-main').shadowRoot.querySelector('.button-compose').click()
    }, 3000);
  }
  let trialFetch = () => {
    expiredTime.value = '' // 试用到期时间
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
        if (isLogin) {
          showTrialEndModal.value = false;
          clearConversition();
          message.info('该会员邮箱不存在，请申请试用！');
        }
        showTrialModal.value = true; // 提醒试用
        // oldUserMessage();
      } else if (res.code == -2) {
        if (isLogin) {
          message.info('您的试用已结束，请购买会员！');
          showVipLoginModal.value = false; // 展示会员购买
        }
        showTrialEndModal.value = true; // 提醒试用结束
        clearConversition();
        // oldUserMessage();
      } else if (res.code == -99) {
        if (isLogin) {
          message.info('您的会员已到期，请新购买会员！');
        }
        clearConversition();
        showVipEndModal.value = true; // 提醒会员到期
      } else if (res.code == 100 || res.code == 200) {
        if (isLogin) {
          message.success('登录成功，欢迎回来！');
        }
        // 展示会员有效期
        expiredTime.value = res.expiredTime || '';
        // 关闭所有弹窗
        showTrialModal.value = false;
        showEmailModal.value = false;
        showTrialEndModal.value = false;
        showVipEndModal.value = false;
        showVipLoginModal.value = false;
      }
    }).catch((err) => {
      console.log(err);
    });
  }

  if (isLogin) {
    // 已登录试用
    formRef.value?.validate((errors) => {
      if (!errors) {
        // 保存用户邮箱
        localStorage.setItem('userEmail', formValue.value.email);
        // fetch向后端发送post请求
        trialFetch()
      }
    })
  } else { // 未登录登录试用
    trialFetch()
  }
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
        } else if (res.code == -2) {
          message.info('当前用户已领取过试用，请登录！');
          // 关闭试用
          showTrialModal.value = false;
          // 展示登录
          showTrialEndModal.value = true;
        } else {
          message.error('领取失败');
        }
      }).catch((err) => {
        console.log(err);
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
    <ChatNav v-if="expiredTime" />
    <ChatPromptStore />
    <Chat />
    <span v-if="expiredTime" style="position: absolute;right: 68px;top: 24px;line-height: 30px;border-radius: 10px;border: 1px solid #d28220;padding: 0 10px;background-color: #ffe5d4;">VIP到期: {{expiredTime}}</span>
  </main>

  <!-- 提醒试用 -->
  <n-modal v-model:show="showTrialModal" :mask-closable="false" :close-on-esc="false">
    <n-card style="width: 600px" :title="showEmailModal ? '领取试用' : '温馨提示'" :bordered="false" size="huge" role="dialog" aria-modal="true">
      <!-- <template #header-extra>
        噢！
      </template> -->
        
      <div align="center" v-if="!showEmailModal">
        <p>免费试用提醒</p>
        <p>🎉 点击下方领取按钮，免费领取试用额度 🎉</p>
        <p>
          若您是会员，请点击
          <n-gradient-text type="info" style="cursor: pointer; font-weight: bold;" @click="showTrialEndModal = true; showVipLoginModal = true">登录</n-gradient-text>
        </p>
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
          <!-- <n-button quaternary @click="showTrialModal = false">
            稍后提醒
          </n-button>
          &nbsp; &nbsp; -->
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

  <!-- 试用过期弹窗 -->
  <n-modal v-model:show="showTrialEndModal" :mask-closable="false" :close-on-esc="false">
    <n-card style="width: 740px" :title="showVipLoginModal ? '会员登录' : '请购买会员'" :bordered="false" size="huge" role="dialog" aria-modal="true">
      <!-- <template #header-extra>
        <span style="font-size: 12px; color:#999; cursor: pointer;" @click="showTrialEndModal = false">关闭</span>
      </template> -->
      <div align="center" v-if="!showVipLoginModal">
        <div style="margin-bottom: 20px;">
          请<span style="font-weight: bold;">「微信」</span>扫一扫，码购买会员。
          若您是会员，请点击
          <n-gradient-text type="info" style="cursor: pointer; font-weight: bold;" @click="showVipLoginModal = true">登录</n-gradient-text>
        </div>
        <n-table :single-line="false">
          <colgroup>
            <col width="32%">
            <col width="36%">
            <col width="32%">
          </colgroup>
          <thead align="center">
            <tr>
              <th>
                <n-gradient-text
                    :gradient="{
                      deg: 180,
                      from: 'rgb(85, 85, 85)',
                      to: 'rgb(99, 99, 99)'
                    }"
                  >
                  月度会员
                </n-gradient-text>
              </th>
              <th>
                <n-gradient-text type="success">
                  半年度会员
                </n-gradient-text>
                <sup style="color: chocolate;"> 推荐</sup>
              </th>
              <th>
                <n-gradient-text
                    :gradient="{
                      deg: 180,
                      from: 'rgb(85, 85, 85)',
                      to: 'rgb(99, 99, 99)'
                    }"
                  >
                  年度会员
                </n-gradient-text>
              </th>
            </tr>
          </thead>
          <tbody align="center">
            <tr style="font-weight: bold; line-height: 26px;">
              <td>
                <img style="display: block;margin:10px auto;" src="https://e.northviewer.cn/wp-content/uploads/2023/06/newbing-1.png" />
                ¥12.8
              </td>
              <td style="font-size:18px">
                <img style="display: block;margin:10px auto;" src="https://e.northviewer.cn/wp-content/uploads/2023/06/newbing-2.png" />
                ¥39.8 
                <sub><s style="font-size:12px;color: #999;">¥76.8</s></sub>
              </td>
              <td>
                <img style="display: block;margin:10px auto;" src="https://e.northviewer.cn/wp-content/uploads/2023/06/newbing-3.png" />
                ¥78.8
              </td>
            </tr>
          </tbody>
        </n-table>
      </div>
      <n-form v-else ref="formRef" :label-width="80"
        :model="formValue" :rules="rules" :size="'medium'"
      >
        <n-form-item label="" path="email">
          <n-input v-model:value="formValue.email" placeholder="请输入您的会员邮箱" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-button style="float:left;" @click="showTrialEndModal = false; showVipLoginModal = false; showEmailModal = false; showTrialModal = true;">
            申请试用
        </n-button>
        <div align="right" v-if="showVipLoginModal">
          <n-button quaternary @click="showVipLoginModal = false">
            &nbsp; 返回 &nbsp;
          </n-button>
          &nbsp; &nbsp;
          <n-button type="primary" @click="newbingTrial('isLogin')">
            立即登录
          </n-button>
        </div>
      </template>
    </n-card>
  </n-modal>

  <!-- vip 过期 -->
  <n-modal v-model:show="showVipEndModal" :mask-closable="false" :close-on-esc="false">
    <n-card style="width: 600px" title="温馨提示" :bordered="false" size="huge" role="dialog" aria-modal="true">
      <div align="center">
        <p>您的会员到期了！如需使用，请续费。</p>
        <img style="display: block; margin: auto;" src="https://e.northviewer.cn/wp-content/uploads/2023/06/newbing-x.png" alt="">
      </div>
    </n-card>
  </n-modal>
</template>
