# Vue 版本说明

这是将 React 版本迁移到 Vue 3 + Element Plus 的实现。

## 项目结构

```
src-vue/
├── api/                    # API 服务层
│   └── dynamicProxy.ts    # 动态代理相关 API
├── assets/                # 静态资源
│   └── logo.svg          # Logo 图标
├── components/            # 公共组件
│   └── SelectLang.vue    # 语言切换组件
├── composables/           # 组合式函数
│   └── useI18n.ts        # 国际化 hook
├── layouts/               # 布局组件
│   └── BasicLayout.vue   # 基础布局
├── locales/               # 国际化文件
│   ├── zh-CN.ts          # 中文
│   └── en-US.ts          # 英文
├── router/                # 路由配置
│   └── index.ts          # 路由定义
├── stores/                # Pinia 状态管理
│   ├── global.ts         # 全局状态
│   └── settings.ts       # 设置状态
├── utils/                 # 工具函数
│   ├── electron.ts       # Electron 通信
│   ├── request.ts        # 请求封装
│   └── utils.ts          # 通用工具
├── views/                 # 页面组件
│   ├── HttpList/         # HTTP 抓包页面
│   │   ├── components/
│   │   │   ├── HttpListOperation.vue
│   │   │   └── HttpPackageDetail.vue
│   │   └── index.vue
│   └── DynamicProxy/     # 动态代理页面
│       ├── components/
│       │   ├── CodeEditor.vue
│       │   └── SettingDetail.vue
│       └── index.vue
├── App.vue               # 根组件
├── main.ts               # 入口文件
└── style.css             # 全局样式
```

## 技术栈

- **Vue 3**: 使用 Composition API
- **Pinia**: 状态管理（替代 Redux/DVA）
- **Vue Router 4**: 路由管理
- **Element Plus**: UI 组件库（替代 Ant Design）
- **TypeScript**: 类型支持
- **Vite**: 构建工具

## 主要变更

### 1. 状态管理
- 从 DVA (Redux) 迁移到 Pinia
- 使用 `defineStore` 定义 store
- 使用 `storeToRefs` 保持响应式

### 2. UI 组件
- Ant Design → Element Plus
- 表格: `<Table>` → `<el-table>`
- 按钮: `<Button>` → `<el-button>`
- 表单: `<Form>` → `<el-form>`
- 对话框: `<Modal>` → `<el-dialog>`
- 图标: `@ant-design/icons` → `@element-plus/icons-vue`

### 3. 路由
- 从 UmiJS 路由迁移到 Vue Router
- 使用嵌套路由实现布局

### 4. 国际化
- 自定义实现 `useI18n` composable
- 支持中英文切换

### 5. 代码编辑器
- 简化实现，使用 `<el-input type="textarea">`
- 可选：集成 Monaco Editor 或 CodeMirror

## 运行项目

### 开发模式
```bash
npm run dev:vue
```

### 构建
```bash
npm run build:vue
```

### 预览
```bash
npm run preview:vue
```

## 与 Electron 集成

Vue 版本保持了与 Electron 的通信接口：

```typescript
// utils/electron.ts
export function handleElectronMessage(callback)
export function sendElectronMessage({ channel, payload })
```

在 `main.ts` 中初始化 Electron 消息监听：

```typescript
handleElectronMessage((channel, payload) => {
  if (['req', 'res'].includes(channel)) {
    globalStore.httpPackageChange(payload);
  } else if (channel === 'proxySettings') {
    globalStore.proxySettingChange(payload);
  }
});
```

## 未修改的代码

以下代码直接从 React 版本复制，保持逻辑不变：

- `utils/utils.ts` - 工具函数（URL 解析等）
- `utils/electron.ts` - Electron 通信逻辑
- `api/dynamicProxy.ts` - API 服务调用

## 注意事项

1. Element Plus 需要手动导入样式：`import 'element-plus/dist/index.css'`
2. 图标需要全局注册或按需导入
3. Pinia store 需要在 Vue 实例创建后才能使用
4. TypeScript 类型定义可能需要根据实际使用调整
