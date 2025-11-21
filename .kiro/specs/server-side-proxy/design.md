# 设计文档

## 概述

本设计为动态代理工具添加后端代理服务器配置功能。该功能允许用户在配置代理规则时，指定系统如何连接到代理目标服务器：直接连接、通过 HTTP 代理或通过 SOCKS5 代理。这为用户在复杂网络环境中使用代理工具提供了更大的灵活性。

核心设计包括：
1. 在前端 UI 中添加后端代理配置组件
2. 扩展数据模型以支持后端代理配置
3. 在后端代理逻辑中实现 HTTP 和 SOCKS5 代理支持
4. 确保配置的持久化存储

## 架构

### 整体架构

系统采用 Electron 架构，包含前端 Vue 应用和后端 Node.js 服务：

```
┌─────────────────────────────────────────────────────────────┐
│                        前端 (Vue 3)                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  SettingDetail.vue                                   │   │
│  │  ├─ 现有配置表单                                      │   │
│  │  └─ BackendProxyConfig.vue (新增)                    │   │
│  │     ├─ 代理协议选择 (直接/HTTP/SOCKS5)               │   │
│  │     ├─ 代理服务器地址输入                            │   │
│  │     └─ 代理端口输入                                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Pinia Store (global.ts)                             │   │
│  │  └─ ProxySetting 接口扩展                            │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓ IPC
┌─────────────────────────────────────────────────────────────┐
│                    后端 (Node.js)                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  proxySettings.js                                    │   │
│  │  └─ 持久化存储后端代理配置                           │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  doProxy.js                                          │   │
│  │  └─ exeProxy() 函数扩展                              │   │
│  │     ├─ 直接连接逻辑 (现有)                           │   │
│  │     ├─ HTTP 代理逻辑 (新增)                          │   │
│  │     └─ SOCKS5 代理逻辑 (新增)                        │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  HTTP/HTTPS 请求                                     │   │
│  │  ├─ 直接连接 → 目标服务器                            │   │
│  │  ├─ HTTP 代理 → HTTP 代理服务器 → 目标服务器         │   │
│  │  └─ SOCKS5 代理 → SOCKS5 代理服务器 → 目标服务器     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 关键设计决策

1. **组件独立性**: 将后端代理配置封装为独立的 Vue 组件 `BackendProxyConfig.vue`，提高代码可维护性和可复用性
2. **条件显示**: 仅当代理目标为 http/https 时显示后端代理配置，file 协议不需要此功能
3. **代理库选择**: 
   - HTTP 代理使用 Node.js 内置的 `http.request` 配合 CONNECT 方法
   - SOCKS5 代理使用 `socks` npm 包（需要添加依赖）
4. **向后兼容**: 对于没有后端代理配置的旧数据，默认使用"直接连接"模式

## 组件和接口

### 前端组件

#### BackendProxyConfig.vue

新增的独立组件，用于配置后端代理。

**Props:**
```typescript
interface Props {
  modelValue: BackendProxyConfig;
  disabled?: boolean;
}
```

**Emits:**
```typescript
interface Emits {
  'update:modelValue': [value: BackendProxyConfig];
}
```

**组件状态:**
```typescript
interface ComponentState {
  proxyType: 'direct' | 'http' | 'socks5';
  proxyHost: string;
  proxyPort: number;
}
```

#### SettingDetail.vue (修改)

在现有的代理设置对话框中集成 `BackendProxyConfig` 组件。

**修改点:**
1. 在 `formData` 中添加 `backendProxy` 字段
2. 在代理目标输入框后添加 `BackendProxyConfig` 组件
3. 使用 `v-if` 控制组件显示（仅当 `toProtocol` 为 http 或 https 时显示）
4. 在表单验证规则中添加后端代理配置的验证

### 后端接口

#### doProxy.js

**修改函数: exeProxy(target, requestDetail, backendProxy)**

添加第三个参数 `backendProxy`，根据配置选择连接方式。

```javascript
function exeProxy(target, requestDetail, backendProxy) {
  if (target.startsWith('file://')) {
    // 现有的文件处理逻辑
    return handleFileProxy(target);
  }
  
  // 根据后端代理配置选择连接方式
  if (!backendProxy || backendProxy.type === 'direct') {
    return handleDirectConnection(target, requestDetail);
  } else if (backendProxy.type === 'http') {
    return handleHttpProxy(target, requestDetail, backendProxy);
  } else if (backendProxy.type === 'socks5') {
    return handleSocks5Proxy(target, requestDetail, backendProxy);
  }
}
```

**新增函数: handleDirectConnection(target, requestDetail)**

封装现有的直接连接逻辑。

**新增函数: handleHttpProxy(target, requestDetail, backendProxy)**

实现通过 HTTP 代理服务器连接。

**新增函数: handleSocks5Proxy(target, requestDetail, backendProxy)**

实现通过 SOCKS5 代理服务器连接。

## 数据模型

### ProxySetting 接口扩展

在 `src-vue/stores/global.ts` 中扩展 `ProxySetting` 接口：

```typescript
export interface BackendProxyConfig {
  type: 'direct' | 'http' | 'socks5';
  host?: string;
  port?: number;
}

export interface ProxySetting {
  id?: string;
  enabled: boolean;
  type: string;
  from: string;
  to: string;
  reqHook: boolean;
  reqHookCode: string;
  resHook: boolean;
  resHookCode: string;
  delay: number;
  backendProxy?: BackendProxyConfig; // 新增字段
}
```

### 默认值

当 `backendProxy` 字段不存在时，使用以下默认值：

```typescript
const defaultBackendProxy: BackendProxyConfig = {
  type: 'direct'
};
```

### 验证规则

1. **代理类型**: 必须是 'direct'、'http' 或 'socks5' 之一
2. **代理主机**: 当类型为 'http' 或 'socks5' 时必填，不能为空字符串
3. **代理端口**: 当类型为 'http' 或 'socks5' 时必填，必须是 1-65535 之间的整数

## 正确性属性

*属性是系统在所有有效执行中应该保持为真的特征或行为——本质上是关于系统应该做什么的形式化陈述。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*


### 属性反思

在编写具体属性之前，我对预分析中识别的属性进行了冗余检查：

**合并的属性:**
- 1.1 和 1.2 合并为"协议类型控制组件显示"属性
- 1.4 和 1.5 合并为"代理类型控制输入框状态"属性
- 2.1, 2.2, 3.1, 3.2 都被 1.5 覆盖，不需要单独的属性
- 2.3 和 3.3 合并为"空地址验证"属性
- 2.4 和 3.4 合并为"端口范围验证"属性
- 2.5, 3.5, 5.1, 5.2 合并为"配置持久化往返"属性

**保留的独立属性:**
- UI 条件渲染、表单验证、代理逻辑、错误处理、数据加载、组件通信等各有独特的验证价值

### 属性列表

属性 1: 协议类型控制组件显示
*对于任何*代理目标协议类型，当协议为 http 或 https 时后端代理配置组件应该显示，当协议为 file 时应该隐藏
**验证需求: 1.1, 1.2**

属性 2: 代理类型控制输入框状态
*对于任何*后端代理类型，当类型为 direct 时代理服务器和端口输入框应该禁用，当类型为 http 或 socks5 时应该启用
**验证需求: 1.4, 1.5**

属性 3: 空地址验证
*对于任何*需要代理服务器的后端代理类型（http 或 socks5），如果代理服务器地址为空或仅包含空白字符，表单验证应该失败并显示错误提示
**验证需求: 2.3, 3.3**

属性 4: 端口范围验证
*对于任何*需要代理端口的后端代理类型（http 或 socks5），如果端口号不在 1-65535 范围内，表单验证应该失败并显示错误提示
**验证需求: 2.4, 3.4**

属性 5: 配置持久化往返
*对于任何*有效的后端代理配置，保存到存储后再读取应该得到等价的配置数据
**验证需求: 2.5, 3.5, 5.1, 5.2**

属性 6: 直接连接不使用代理
*对于任何*目标 URL，当后端代理类型为 direct 时，生成的请求选项应该直接指向目标服务器的主机名和端口
**验证需求: 4.1**

属性 7: HTTP 代理连接配置
*对于任何*目标 URL 和 HTTP 代理配置，生成的请求应该先连接到 HTTP 代理服务器，并使用 CONNECT 方法建立隧道
**验证需求: 4.2**

属性 8: SOCKS5 代理连接配置
*对于任何*目标 URL 和 SOCKS5 代理配置，生成的请求应该通过 SOCKS5 代理服务器建立连接
**验证需求: 4.3**

属性 9: 配置加载正确性
*对于任何*已保存的代理规则，编辑时加载的后端代理配置应该与保存时的配置等价
**验证需求: 5.3**

属性 10: 规则删除完整性
*对于任何*代理规则，删除后该规则的所有数据（包括后端代理配置）都不应该在存储中存在
**验证需求: 5.4**

属性 11: 组件事件通知
*对于任何*后端代理配置的变化，组件应该触发 update:modelValue 事件并传递新的配置值
**验证需求: 6.3**

属性 12: 组件状态渲染
*对于任何*有效的后端代理配置数据，组件渲染后的 UI 状态应该与配置数据一致
**验证需求: 6.4**

## 错误处理

### 前端错误处理

1. **表单验证错误**
   - 空地址错误: "代理服务器地址不能为空"
   - 端口范围错误: "端口号必须在 1-65535 之间"
   - 显示方式: 在输入框下方显示红色错误提示文本

2. **数据加载错误**
   - 如果加载的配置数据格式不正确，使用默认值并在控制台记录警告
   - 确保 UI 不会因为数据问题而崩溃

3. **组件通信错误**
   - 如果父组件未正确处理事件，组件应该继续正常工作
   - 使用 TypeScript 类型确保接口正确性

### 后端错误处理

1. **HTTP 代理连接错误**
   - 代理服务器无法连接: 返回 502 Bad Gateway
   - 代理服务器拒绝连接: 返回 502 Bad Gateway
   - 代理认证失败: 返回 407 Proxy Authentication Required
   - 错误响应体包含详细的错误信息

2. **SOCKS5 代理连接错误**
   - SOCKS5 服务器无法连接: 返回 502 Bad Gateway
   - SOCKS5 握手失败: 返回 502 Bad Gateway
   - 目标主机无法到达: 返回 502 Bad Gateway
   - 错误响应体包含详细的错误信息

3. **配置验证错误**
   - 在执行代理前验证配置的完整性
   - 如果配置无效，记录错误并使用直接连接作为降级方案

4. **异常捕获**
   - 所有代理逻辑使用 try-catch 包裹
   - 捕获的异常转换为适当的 HTTP 错误响应
   - 在日志中记录详细的错误堆栈以便调试

## 测试策略

### 单元测试

使用 Jest 作为测试框架，针对以下模块编写单元测试：

**前端单元测试:**

1. **BackendProxyConfig.vue 组件测试**
   - 测试组件在不同 props 下的渲染结果
   - 测试用户交互（选择代理类型、输入地址和端口）
   - 测试事件触发（update:modelValue）
   - 测试表单验证逻辑

2. **SettingDetail.vue 集成测试**
   - 测试 BackendProxyConfig 组件的条件显示
   - 测试表单提交时包含后端代理配置
   - 测试编辑现有规则时正确加载配置

**后端单元测试:**

1. **doProxy.js 函数测试**
   - 测试 handleDirectConnection 函数
   - 测试 handleHttpProxy 函数
   - 测试 handleSocks5Proxy 函数
   - 测试错误处理逻辑

2. **proxySettings.js 持久化测试**
   - 测试保存包含后端代理配置的规则
   - 测试读取包含后端代理配置的规则
   - 测试向后兼容性（读取没有 backendProxy 字段的旧数据）

### 属性测试

使用 fast-check 作为属性测试库（需要添加依赖），针对正确性属性编写属性测试：

**配置要求:**
- 每个属性测试至少运行 100 次迭代
- 每个属性测试必须使用注释标记对应的设计文档属性

**属性测试标记格式:**
```javascript
// **Feature: server-side-proxy, Property 1: 协议类型控制组件显示**
```

**测试覆盖:**
- 属性 1-5: 前端 UI 和验证逻辑
- 属性 6-8: 后端代理连接逻辑
- 属性 9-12: 数据持久化和组件通信

**生成器设计:**
- URL 生成器: 生成各种有效的 http/https/file URL
- 代理配置生成器: 生成各种有效和边界情况的代理配置
- 端口生成器: 生成有效端口（1-65535）和无效端口（边界外）
- 字符串生成器: 生成空字符串、空白字符串、正常字符串

### 集成测试

1. **端到端代理流程测试**
   - 启动测试代理服务器（HTTP 和 SOCKS5）
   - 配置代理规则使用测试代理服务器
   - 发送测试请求并验证请求经过代理服务器
   - 验证响应正确返回

2. **UI 到后端集成测试**
   - 在 UI 中配置后端代理
   - 保存配置
   - 触发代理请求
   - 验证请求使用了配置的代理

### 测试数据

**有效的测试配置:**
```javascript
{
  type: 'http',
  host: '127.0.0.1',
  port: 8080
}

{
  type: 'socks5',
  host: 'proxy.example.com',
  port: 1080
}

{
  type: 'direct'
}
```

**无效的测试配置:**
```javascript
{
  type: 'http',
  host: '',  // 空地址
  port: 8080
}

{
  type: 'socks5',
  host: 'proxy.example.com',
  port: 0  // 无效端口
}

{
  type: 'socks5',
  host: 'proxy.example.com',
  port: 70000  // 超出范围
}
```

## 依赖项

### 新增 npm 依赖

1. **socks** (^2.7.0)
   - 用途: 实现 SOCKS5 代理客户端
   - 许可证: MIT
   - 安装: `npm install socks`

2. **fast-check** (^3.0.0) - 开发依赖
   - 用途: 属性测试框架
   - 许可证: MIT
   - 安装: `npm install --save-dev fast-check`

3. **@types/socks** (^2.7.0) - 开发依赖
   - 用途: socks 库的 TypeScript 类型定义
   - 许可证: MIT
   - 安装: `npm install --save-dev @types/socks`

### 现有依赖使用

- **http/https**: Node.js 内置模块，用于 HTTP 代理
- **element-plus**: 现有 UI 组件库
- **vue**: 现有前端框架
- **pinia**: 现有状态管理
- **electron-store**: 现有持久化存储

## 实现注意事项

1. **安全性**
   - 不在日志中记录代理服务器的认证信息
   - 验证用户输入以防止注入攻击
   - 对代理连接设置合理的超时时间

2. **性能**
   - 代理连接复用（如果可能）
   - 避免在主线程中执行阻塞操作
   - 对大量并发请求进行适当的限流

3. **兼容性**
   - 确保向后兼容没有 backendProxy 字段的旧配置
   - 支持 IPv4 和 IPv6 地址
   - 处理各种网络环境（防火墙、NAT 等）

4. **可维护性**
   - 代码模块化，每个代理类型独立实现
   - 充分的注释和文档
   - 统一的错误处理模式
   - 清晰的日志输出便于调试

5. **用户体验**
   - 提供清晰的错误提示
   - 表单验证实时反馈
   - 保存配置时显示加载状态
   - 代理连接失败时提供有用的诊断信息
