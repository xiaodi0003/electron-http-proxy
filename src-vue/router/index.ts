import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import BasicLayout from '../layouts/BasicLayout.vue';
import HttpList from '../views/HttpList/index.vue';
import DynamicProxy from '../views/DynamicProxy/index.vue';

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
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
