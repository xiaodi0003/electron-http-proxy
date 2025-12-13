import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router';
import BasicLayout from '../layouts/BasicLayout.vue';
import HttpList from '../views/HttpList/index.vue';
import DynamicProxy from '../views/DynamicProxy/index.vue';
import BypassList from '../views/BypassList/index.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: BasicLayout,
    redirect: '/http-list',
    children: [
      {
        path: '/http-list',
        name: 'HttpList',
        component: HttpList,
      },
      {
        path: '/dynamic-proxy',
        name: 'DynamicProxy',
        component: DynamicProxy,
      },
      {
        path: '/bypasslist',
        name: 'BypassList',
        component: BypassList,
      },
    ],
  },
];

const router = createRouter({
  history: createWebHashHistory(), // Use hash mode for Electron file:// protocol
  routes,
});

export default router;
