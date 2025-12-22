const HttpProxyServer = require('./httpProxyServer');

const port = process.env.HTTP_PROXY_PORT || 8888;
const proxy = new HttpProxyServer(port);

proxy.start();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down proxy server...');
  proxy.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  proxy.stop();
  process.exit(0);
});
