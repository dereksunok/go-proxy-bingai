const showMessage = (type, text, duration) => {
    const messageContainer = document.getElementById('messageContainer');
    const message = document.createElement('div');
    message.textContent = text;
    message.classList.add('cus-message', type);
    messageContainer.appendChild(message);
    setTimeout(() => {
      messageContainer.removeChild(message);
    }, duration);
}
const naiveMessage = {
    success(text, options = {}) {
        showMessage('success', text, options.duration || 5000);
    },
    info(text, options = {}) {
        showMessage('info', text, options.duration || 5000);
    },
    warning(text, options = {}) {
        showMessage('warning', text, options.duration || 5000);
    },
    error(text, options = {}) {
        showMessage('error', text, options.duration || 5000);
    },
};
const App = {
    data() {
        let href = location.origin + location.pathname
        let showHrefBtn = location.hash && location.hash.indexOf("w") > -1
        return {
            // page btn
            pageUrl: href,
            showHrefBtn: showHrefBtn,
            // page btn end
            url: 'https://fc-mp-fa7d97b0-49d8-409e-a902-fbfa876d91b0.next.bspapp.com',
            showTrialModal: false,
            showEmailModal: false,
            showTrialEndModal: false,
            showVipEndModal: false,
            showVipLoginModal: false,
            expiredTime: '',
            delayTimer: null,

            formRef: null,
            formValue: {
                email: ''
            },
            rules:{
                email: { // 试用正则表达式验证邮箱
                    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    required: true,
                    message: '请正确输入您的邮箱',
                    trigger: ['input']
                }
            }
        }
    },
    mounted() {
        window.PAGE_EVENT_BUS.on('pageCheckUser', () => {
            this.newbingTrial();
        });
        this.init();
    },
    methods: {
        init() {
            setTimeout(() => {
                this.newbingTrial();
            }, 1000);
        },
        newbingTrial (isLogin = '') {
            let clearConversition = () => {
              // 清空会话
              let clearText = () => {
                let stop_button = document.getElementById('stop_button')
                if (stop_button) {
                    stop_button.click()
                    document.getElementById('preview_text').value = ''
                }
              }
              if (this.delayTimer) clearTimeout(this.delayTimer)
              this.delayTimer = setTimeout(() => {
                // 请空会话
                console.log('清空会话');
                setTimeout(() => {
                    clearText()
                    setTimeout(() => {
                        clearText()
                        setTimeout(() => {
                            clearText()
                        }, 3000);
                    }, 3000);
                }, 3000);
              }, 1000);
            }
            let trialFetch = () => {
              this.expiredTime = '' // 试用到期时间
              // 试用fetch向后端发送post请求
              fetch(this.url + '/api/newbingTrial', {
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
                    this.showTrialEndModal = false;
                    clearConversition();
                    naiveMessage.info('该会员邮箱不存在，请申请试用！');
                  }
                  this.showTrialModal = true; // 提醒试用
                } else if (res.code == -2) {
                  if (isLogin) {
                    naiveMessage.info('您的试用已结束，请购买会员！');
                    this.showVipLoginModal = false; // 展示会员购买
                  }
                  this.showTrialEndModal = true; // 提醒试用结束
                  clearConversition();
                } else if (res.code == -99) {
                  if (isLogin) {
                    naiveMessage.info('您的会员已到期，请新购买会员！');
                  }
                  clearConversition();
                  this.showVipEndModal = true; // 提醒会员到期
                } else if (res.code == 100 || res.code == 200) {
                  if (isLogin) {
                    naiveMessage.success('登录成功，欢迎回来！');
                  }
                  // 展示会员有效期
                  this.expiredTime = res.expiredTime || '';
                  // 关闭所有弹窗
                  this.showTrialModal = false;
                  this.showEmailModal = false;
                  this.showTrialEndModal = false;
                  this.showVipEndModal = false;
                  this.showVipLoginModal = false;
                }
              }).catch((err) => {
                console.log(err);
              });
            }
          
            if (isLogin) {
              // 已登录试用
              this.$refs.formRef.validate((errors) => {
                if (!errors) {
                  // 保存用户邮箱
                  localStorage.setItem('userEmail', this.formValue.email);
                  // fetch向后端发送post请求
                  trialFetch()
                }
              })
            } else { // 未登录登录试用
              trialFetch()
            }
        },
        getUserTrial (e) {
            e.preventDefault()
            this.$refs.formRef.validate((errors) => {
              if (!errors) {
                // fetch向后端发送post请求 
                fetch(this.url+'/api/newbingCreate', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    userEmail: this.formValue.email,
                  }),
                }).then((res) => res.json()).then((res) => {
                  if (res.code === 100) {
                    this.showTrialModal = false;
                    this.showEmailModal = false;
                    localStorage.setItem('userEmail', this.formValue.email);
                    naiveMessage.success('领取成功，请直接开始会话！', { duration: 5000 });
                  } else if (res.code == -2) {
                    naiveMessage.info('当前用户已领取过试用，请登录！');
                    // 关闭试用
                    this.showTrialModal = false;
                    // 展示登录
                    this.showTrialEndModal = true;
                  } else {
                    naiveMessage.error('领取失败');
                  }
                }).catch((err) => {
                  console.log(err);
                });
              } else {
                console.log(errors)
              }
            })
          }
    },
    template: `
        <div style="position: absolute; right: 40px; top: 22px;">
          <a 
            style="float: right;font-size: 12px;line-height: 22px;border: 1px solid rgb(113 113 113);margin-left: 10px;padding: 0px 15px;border-radius: 10px;background-color: rgb(242 242 242);color: #666;"
            :href="pageUrl" v-if="showHrefBtn" target="_blank"
          >
            全屏展示
          </a>
          <span 
            style="float: right;font-size: 12px; line-height: 22px; border-radius: 10px; border: 1px solid rgb(210, 130, 32); padding: 0px 15px; background-color: rgb(255, 229, 212);"
            v-if="expiredTime"
          >
            VIP到期: {{ expiredTime }}
          </span>
        
        </div>
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
                    <n-input class="email-input" v-model:value="formValue.email" placeholder="请输入您的邮箱，免费领取试用额度"></n-input>
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
                <n-input v-model:value="formValue.email" placeholder="请输入您的会员邮箱" class="email-input" ></n-input>
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

        <n-modal v-model:show="showVipEndModal" :mask-closable="false" :close-on-esc="false">
            <n-card style="width: 600px" title="温馨提示" :bordered="false" size="huge" role="dialog" aria-modal="true">
            <div align="center">
                <p>您的会员到期了！如需使用，请续费。</p>
                <img style="display: block; margin: auto;" src="https://e.northviewer.cn/wp-content/uploads/2023/06/newbing-x.png" alt="">
            </div>
            </n-card>
        </n-modal>
    `
}
const app = Vue.createApp(App);
app.use(naive);
app.mount('#pageCheckUser')