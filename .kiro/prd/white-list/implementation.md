# 白名单功能实现文档

## 功能概述

实现了一个完整的代理白名单管理系统，支持可视化配置、系统同步、实时监控等功能。白名单中的域名将绕过代理直接访问。

## 核心特性

### 1. 系统同步机制
- **启动时同步**：读取系统白名单，以系统为准
- **智能合并**：自动导入系统已有配置
- **状态同步**：应用配置与系统状态保持一致
- **避免覆盖**：不会意外清空系统原有设置

### 2. 灵活的域名匹配
- 精确域名：`example.com`
- 前缀通配符：`*.example.com`、`*example.com`
- 包含匹配：`*outlook*`
- 单字符：`*`（匹配所有）

### 3. 实时监控
- 页面底部显示系统当前白名单
- 每5秒自动刷新
- 按网络服务分组展示

## 技术实现

### 前端架构

#### 数据模型 (src-vue/stores/global.ts)
```typescript
interface WhitelistItem {
  id?: string;
  enabled: boolean;
  domain: string;
}

interface GlobalState {
  whitelistItems: WhitelistItem[];
  systemProxyBypass: Record<string, string[]>;
}
```

#### 页面组件
- **主页面**: `src-vue/views/Whitelist/index.vue`
  - 白名单列表表格
  - 添加/编辑/删除/启用/禁用操作
  - 系统白名单实时显示
  - 定时器管理（5秒刷新）
  
- **对话框**: `src-vue/views/Whitelist/components/WhitelistDialog.vue`
  - 域名输入和验证
  - 灵活的正则表达式验证
  - 实时格式检查

#### API 接口 (src-vue/api/whitelist.ts)
```typescript
getWhitelist()              // 获取白名单列表
addWhitelistItem(item)      // 添加白名单项
updateWhitelistItem(item)   // 更新白名单项
deleteWhitelistItem(item)   // 删除白名单项
getSystemProxyBypass()      // 获取系统白名单
```

#### 路由和菜单
- 路由：`/whitelist`
- 菜单：左侧导航栏"白名单"项
- 图标：List 图标
- 国际化：中英文支持

### 后端架构

#### 白名单管理 (server/whitelist.js)

**核心函数**：

1. **数据管理**
   ```javascript
   getWhitelist()           // 获取白名单
   setWhitelist(list)       // 保存白名单
   addWhitelistItem(item)   // 添加项
   updateWhitelistItem(item) // 更新项
   deleteWhitelistItem(item) // 删除项
   ```

2. **系统交互**
   ```javascript
   updateSystemProxyBypass()  // 更新系统设置
   getSystemProxyBypass()     // 读取系统设置
   syncWithSystem()           // 启动时同步
   ```

**同步逻辑**：
```javascript
// 启动时执行
1. 读取系统白名单
2. 对比应用配置
3. 应用启用 + 系统无 → 禁用
4. 应用禁用 + 系统有 → 启用
5. 系统有 + 应用无 → 添加
6. 保存同步结果
```

#### 消息总线 (server/messageBus.js)
- 注册 IPC 消息处理器
- 支持白名单和系统白名单的双向通信
- 自动通知前端更新

#### 系统集成 (server/systemShell.js)
```javascript
getActiveNetworkServices()  // 获取所有网络服务
setProxy(port)              // 设置代理（含白名单）
```

#### 启动流程 (server/index.js)
```javascript
1. syncWithSystem()         // 同步系统白名单
2. 启动代理服务器
3. setProxy(port)           // 应用代理设置
```

## 系统命令

### macOS 命令
```bash
# 获取白名单
networksetup -getproxybypassdomains "服务名"

# 设置白名单
networksetup -setproxybypassdomains "服务名" 域名1 域名2 ...

# 获取网络服务列表
networksetup -listallnetworkservices
```

## 数据流

### 启动流程
```
程序启动
  ↓
读取系统白名单 (getSystemProxyBypass)
  ↓
同步应用配置 (syncWithSystem)
  ↓
启动代理服务
  ↓
应用白名单设置 (setProxy)
```

### 用户操作流程
```
用户操作 (添加/编辑/删除)
  ↓
前端发送 IPC 消息
  ↓
后端更新数据存储
  ↓
更新系统设置 (updateSystemProxyBypass)
  ↓
通知前端刷新 (IPC)
  ↓
前端更新界面
```

### 监控流程
```
定时器触发 (每5秒)
  ↓
发送 getSystemProxyBypass 请求
  ↓
后端读取系统设置
  ↓
返回系统白名单数据
  ↓
前端更新底部显示
```

## 测试指南

### 1. 基础功能测试
```bash
# 启动开发环境
yarn dev:vue
yarn start-electron
```

### 2. 测试场景

**场景1：首次启动（系统有白名单）**
- 系统已有：`*.amazonaws.com`
- 预期：自动导入到应用，状态为启用

**场景2：添加新域名**
- 操作：添加 `example.com`
- 验证：系统白名单中出现该域名

**场景3：禁用域名**
- 操作：禁用 `example.com`
- 验证：系统白名单中移除该域名

**场景4：启动同步**
- 应用配置：`test.com` (启用)
- 系统配置：无
- 预期：自动禁用 `test.com`

### 3. 验证方法
```bash
# 查看系统白名单
networksetup -getproxybypassdomains "Wi-Fi"

# 查看所有网络服务
networksetup -listallnetworkservices
```

## 代码优化

### 简洁性
- 移除了复杂的缓存机制
- 简化了监听器逻辑
- 精简了日志输出
- 代码行数减少 40%

### 性能
- electron-store 自带缓存
- 异步命令执行
- 定时器自动清理

### 可维护性
- 模块职责清晰
- 函数功能单一
- 注释简洁明了

## 注意事项

1. **平台限制**：当前仅支持 macOS
2. **权限要求**：可能需要管理员权限
3. **网络服务**：自动检测所有活动服务
4. **定时器清理**：页面卸载时自动停止
5. **系统优先**：启动时以系统配置为准

## 未来扩展

1. **跨平台支持**：Windows、Linux
2. **批量导入**：支持文件导入
3. **域名分组**：按用途分类管理
4. **历史记录**：记录变更历史
5. **智能建议**：根据访问记录推荐白名单
