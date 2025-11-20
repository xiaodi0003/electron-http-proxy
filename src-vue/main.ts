import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import App from './App.vue';
import router from './router';
import { handleElectronMessage } from './utils/electron';
import { useGlobalStore } from './stores/global';
import './style.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(ElementPlus);

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.mount('#app');

// 处理 Electron 消息
const globalStore = useGlobalStore();
handleElectronMessage((channel: string, payload: any) => {
  if (['req', 'res'].includes(channel)) {
    globalStore.httpPackageChange(payload);
  } else if (channel === 'proxySettings') {
    globalStore.proxySettingChange(payload);
  }
});
