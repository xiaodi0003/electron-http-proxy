const AnyProxy = require('anyproxy');
const rule = require('./rule');
const systemShell = require('./systemShell');

exports.start = function(port) {
  const options = {
    port,
    rule,
    webInterface: {
      enable: true,
      webPort: 8002
    },
    throttle: 10000,
    forceProxyHttps: true,
    wsIntercept: false, // 不开启websocket代理
    silent: true  // Disable AnyProxy native logs
  };
  const proxyServer = new AnyProxy.ProxyServer(options);
  
  proxyServer.on('ready', () => { /* */ });
  proxyServer.on('error', () => { /* */ });
  proxyServer.start();

  // AnyProxy.utils.systemProxyMgr.enableGlobalProxy('127.0.0.1', port);
  systemShell.setProxy(port);
};

exports.end = function() {
  // 用AnyProxy无法关闭https的代理
  // AnyProxy.utils.systemProxyMgr.disableGlobalProxy();
  systemShell.deleteProxy();
  proxyServer.close();
}
