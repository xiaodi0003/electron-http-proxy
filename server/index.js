const AnyProxy = require('anyproxy');
const rule = require('./rule');
const systemShell = require('./systemShell');
const whitelist = require('./whitelist');

let proxyServer = null;

exports.start = async function(port) {
  // Sync whitelist with system before starting
  await whitelist.syncWithSystem();
  
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
  proxyServer = new AnyProxy.ProxyServer(options);
  
  proxyServer.on('ready', () => { /* */ });
  proxyServer.on('error', () => { /* */ });
  proxyServer.start();

  // AnyProxy.utils.systemProxyMgr.enableGlobalProxy('127.0.0.1', port);
  await systemShell.setProxy(port);
};

exports.end = async function() {
  // Clean up system proxy first
  await systemShell.deleteProxy();
  
  // Then close proxy server
  if (proxyServer) {
    proxyServer.close();
    proxyServer = null;
  }
}
