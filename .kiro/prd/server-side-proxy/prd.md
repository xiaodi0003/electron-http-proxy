# 增加后端代理服务器

## UI

- UI在这里 src-vue/views/DynamicProxy/components/SettingDetail.vue

- 当代理目标选择http或者https的时候，新增一个后台代理配置

- 代理协议包括 直接连接、http和SOCKS5，3种

- 如果是http和socks5，则可配置代理服务器和代理端口

- 如果是直接连接，则代理服务器和代理端口不可配置

- 参考 [代理服务器配置](1.png)

- 这部分配置的UI放在一个独立的组件中实现

## 代理逻辑

### 直接连接

- 不做任何处理

### http

- 所有发送给后端的请求，都先经过这个http代理服务器，然后再发送给后端

### socks5

- 所有发送给后端的请求，都先经过这个socks5代理服务器，然后再发送给后端