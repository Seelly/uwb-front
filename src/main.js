import Vue from 'vue'
import App from './App.vue'

import VueRouter from 'vue-router'
import IndexPages from "@/views/Index.vue";
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import ViewDetail from "@/views/Detail";

Vue.use(ElementUI);
Vue.config.productionTip = false

Vue.use(VueRouter)
const routes = [
  { path: '/',
    name: 'view',
    component: ViewDetail
  },
  { path: '/edit',
    name: 'edit',
    component: IndexPages
  },
]
const router = new VueRouter({
  routes
})

new Vue({
  router,
  el:"#app",
  render: h => h(App),
}).$mount('#app')


// const host = 'http://127.0.0.1:8080'
// this.$host = host
