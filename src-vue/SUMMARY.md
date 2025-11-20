# Vue 版本迁移总结

## 已完成的工作

### 1. 项目结构搭建 ✅
- 创建了完整的 Vue 3 项目结构
- 使用 Vite 作为构建工具
- 配置了 TypeScript 支持

### 2. 状态管理 ✅
- 使用 Pinia 替代 Redux/DVA
- 创建了 `global` store（管理 HTTP 包和代理设置）
- 创建了 `settings` store（管理应用设置）

### 3. 路由配置 ✅
- 使用 Vue Router 4
- 配置了嵌套路由
- 实现了两个主要页面：
  - `/http-list` - HTTP 抓包页面
  - `/dynamic-proxy` - 动态代理页面

### 4. 页面组件 ✅

#### HttpList 页面
- `views/HttpList/index.vue` - 主页面
- `views/HttpList/components/HttpListOperation.vue` - 操作栏（启动/暂停/清空）
- `views/HttpList/components/HttpPackageDetail.vue` - 请求详情对话框

#### DynamicProxy 页面
- `views/DynamicProxy/index.vue` - 主页面
- `views/DynamicProxy/components/SettingDetail.vue` - 代理设置对话框
- `views/DynamicProxy/components/CodeEditor.vue` - 代码编辑器

### 5. 布局组件 ✅
- `layouts/BasicLayout.vue` - 基础布局（侧边栏 + 头部 + 内容区）
- 支持侧边栏折叠
- 集成了语言切换功能

### 6. 公共组件 ✅
- `components/SelectLang.vue` - 语言切换组件

### 7. 工具函数 ✅
- `utils/electron.ts` - Electron 通信（完全复用原代码）
- `utils/utils.ts` - 通用工具函数（完全复用原代码）
- `utils/request.ts` - 请求封装（适配 Element Plus）

### 8. 国际化 ✅
- `composables/useI18n.ts` - 自定义国际化 hook
- `locales/zh-CN.ts` - 中文翻译
- `locales/en-US.ts` - 英文翻译

### 9. API 服务 ✅
- `api/dynamicProxy.ts` - 动态代理相关 API（完全复用原代码）

## UI 组件映射

| React (Ant Design) | Vue (Element Plus) |
|-------------------|-------------------|
| `<Table>` | `<el-table>` |
| `<Button>` | `<el-button>` |
| `<Form>` | `<el-form>` |
| `<Input>` | `<el-input>` |
| `<Modal>` | `<el-dialog>` |
| `<Switch>` | `<el-switch>` |
| `<Radio>` | `<el-radio>` |
| `<Select>` | `<el-select>` |
| `<Tabs>` | `<el-tabs>` |
| `<Tooltip>` | `<el-tooltip>` |
| `<Dropdown>` | `<el-dropdown>` |
| `<Icon>` | `<el-icon>` |

## 核心差异

### 1. 组件语法
- React: JSX + Hooks
- Vue: Template + Composition API

### 2. 状态管理
- React: Redux/DVA (dispatch actions)
- Vue: Pinia (直接调用 actions)

### 3. 响应式
- React: `useState`, `useEffect`
- Vue: `ref`, `reactive`, `watch`, `computed`

### 4. 事件处理
- React: `onClick={handler}`
- Vue: `@click="handler"`

### 5. 双向绑定
- React: 手动处理 `value` + `onChange`
- Vue: `v-model`

## 完全复用的代码

以下代码从 React 版本直接复制，无需修改：

1. **Electron 通信逻辑** (`utils/electron.ts`)
   - `handleElectronMessage`
   - `sendElectronMessage`

2. **工具函数** (`utils/utils.ts`)
   - `getDomain` - 获取域名
   - `getPath` - 获取路径
   - `getProtocol` - 获取协议
   - `getPort` - 获取端口

3. **API 服务** (`api/dynamicProxy.ts`)
   - `getProxySettings`
   - `addProxySetting`
   - `updateProxySetting`
   - `deleteProxySetting`

4. **类型定义**
   - `HttpPackage`
   - `ProxySetting`
   - `HttpListConfig`

## 运行步骤

### 1. 安装依赖
```bash
npm install
```

如果遇到 rollup 相关错误，执行：
```bash
rm -rf node_modules package-lock.json
npm install
```

### 2. 开发模式
```bash
npm run dev:vue
```

访问 http://localhost:3000

### 3. 构建生产版本
```bash
npm run build:vue
```

输出目录：`dist-vue/`

### 4. 预览生产版本
```bash
npm run preview:vue
```

## 与 Electron 集成

Vue 版本保持了与 Electron 的完全兼容：

1. **消息监听**：在 `main.ts` 中初始化
2. **消息发送**：通过 `sendElectronMessage` 函数
3. **数据同步**：通过 Pinia store 管理状态

## 注意事项

1. **Element Plus 样式**
   - 需要在 `main.ts` 中导入：`import 'element-plus/dist/index.css'`

2. **图标使用**
   - 全局注册了所有 Element Plus 图标
   - 使用方式：`<el-icon><Edit /></el-icon>`

3. **TypeScript 配置**
   - 确保 `tsconfig.json` 包含 Vue 相关配置
   - 可能需要安装 `@types/node`

4. **代码编辑器**
   - 当前使用简单的 textarea
   - 可选升级为 Monaco Editor 或 CodeMirror

5. **样式作用域**
   - Vue 组件使用 `<style scoped>` 实现样式隔离
   - 全局样式在 `style.css` 中定义

## 文件对比

### React 版本
```
src/
├── components/
├── layouts/
├── models/          # DVA models
├── pages/
├── utils/
└── electron.js
```

### Vue 版本
```
src-vue/
├── api/             # API 服务
├── components/
├── composables/     # 组合式函数
├── layouts/
├── locales/         # 国际化
├── router/          # 路由
├── stores/          # Pinia stores
├── utils/
└── views/           # 页面
```

## 下一步优化建议

1. **代码编辑器增强**
   - 集成 Monaco Editor 或 CodeMirror
   - 添加语法高亮和代码提示

2. **测试**
   - 添加单元测试（Vitest）
   - 添加 E2E 测试（Playwright）

3. **性能优化**
   - 使用虚拟滚动处理大量 HTTP 包
   - 懒加载路由组件

4. **功能增强**
   - 添加搜索过滤功能
   - 添加导出功能
   - 添加主题切换

5. **代码质量**
   - 添加 ESLint 配置
   - 添加 Prettier 配置
   - 添加 Git hooks

## 总结

Vue 版本成功实现了 React 版本的所有核心功能，主要优势：

1. ✅ **代码更简洁**：Composition API + Template 语法
2. ✅ **类型安全**：完整的 TypeScript 支持
3. ✅ **性能优化**：Vue 3 的响应式系统
4. ✅ **开发体验**：Vite 的快速热更新
5. ✅ **逻辑复用**：与 React 版本共享核心逻辑代码

所有与 UI 无关的代码（Electron 通信、工具函数、API 服务）都完全复用，确保了两个版本的行为一致性。
