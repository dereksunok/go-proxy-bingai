import { ref } from './vue.esm-browser.prod.js'
export default {
    setup() {
        const url = ref('https://fc-mp-fa7d97b0-49d8-409e-a902-fbfa876d91b0.next.bspapp.com')
        const showTrialModal = ref(false); // 提醒试用
        const showEmailModal = ref(false); // 提醒试用结束
        const showTrialEndModal = ref(false); // 提醒试用结束
        const showVipEndModal = ref(false); // 提醒会员到期
        const showVipLoginModal = ref(false); // 提醒会员登录
        const expiredTime = ref(''); // 试用到期时间
        let delayTimer = ref(null); // 延时器

        return {
            url,
            showTrialModal,
            showEmailModal,
            showTrialEndModal,
            showVipEndModal,
            showVipLoginModal,
            expiredTime,
            delayTimer
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
            }, 3000);
        },
        newbingTrial (isLogin = '') {
            let clearConversition = () => {
              // 清空会话
              if (this.delayTimer) clearTimeout(this.delayTimer)
              this.delayTimer = setTimeout(() => {
                // 请空会话
                console.log('清空会话');
              }, 3000);
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
                    alert('该会员邮箱不存在，请申请试用！');
                  }
                  this.showTrialModal = true; // 提醒试用
                } else if (res.code == -2) {
                  if (isLogin) {
                    alert('您的试用已结束，请购买会员！');
                    this.showVipLoginModal = false; // 展示会员购买
                  }
                  this.showTrialEndModal = true; // 提醒试用结束
                  clearConversition();
                } else if (res.code == -99) {
                  if (isLogin) {
                    alert('您的会员已到期，请新购买会员！');
                  }
                  clearConversition();
                  this.showVipEndModal = true; // 提醒会员到期
                } else if (res.code == 100 || res.code == 200) {
                  if (isLogin) {
                    alert('登录成功，欢迎回来！');
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
              formRef?.validate((errors) => {
                if (!errors) {
                  // 保存用户邮箱
                  localStorage.setItem('userEmail', formValue.email);
                  // fetch向后端发送post请求
                  trialFetch()
                }
              })
            } else { // 未登录登录试用
              trialFetch()
            }
        }
    },
    template: `
        <div v-if="showTrialModal">
            showTrialModal {{ url }}
        </div>

        <div v-if="!showTrialModal">
            !showTrialModal {{ url }}
        </div>
    `
}