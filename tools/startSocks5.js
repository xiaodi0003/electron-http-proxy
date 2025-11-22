const Socks5Server = require('../tools/socks5Server');

// Create and start SOCKS5 server
const socks5 = new Socks5Server({
  port: 1080,
  host: '0.0.0.0',
  // Uncomment below to enable authentication
  // auth: {
  //   username: 'admin',
  //   password: 'password'
  // }
});

socks5.start();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down SOCKS5 server...');
  socks5.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down SOCKS5 server...');
  socks5.stop();
  process.exit(0);
});
