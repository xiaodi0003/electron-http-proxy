const http = require('http');
const net = require('net');
const url = require('url');

class HttpProxyServer {
  constructor(port = 8888) {
    this.port = port;
    this.server = null;
  }

  start() {
    this.server = http.createServer((req, res) => {
      // Handle HTTP requests
      this.handleHttpRequest(req, res);
    });

    // Handle HTTPS CONNECT requests
    this.server.on('connect', (req, clientSocket, head) => {
      this.handleHttpsConnect(req, clientSocket, head);
    });

    this.server.listen(this.port, () => {
      console.log(`HTTP Proxy Server running on port ${this.port}`);
    });

    this.server.on('error', (err) => {
      console.error('Proxy server error:', err);
    });
  }

  handleHttpRequest(req, res) {
    const targetUrl = url.parse(req.url);
    
    const options = {
      hostname: targetUrl.hostname,
      port: targetUrl.port || 80,
      path: targetUrl.path,
      method: req.method,
      headers: req.headers,
    };

    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error('Proxy request error:', err);
      res.writeHead(502);
      res.end('Bad Gateway');
    });

    req.pipe(proxyReq);
  }

  handleHttpsConnect(req, clientSocket, head) {
    // Parse hostname:port from CONNECT request
    const [hostname, port] = req.url.split(':');
    const targetPort = parseInt(port) || 443;
    
    const serverSocket = net.connect(targetPort, hostname, () => {
      clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
      serverSocket.write(head);
      serverSocket.pipe(clientSocket);
      clientSocket.pipe(serverSocket);
    });

    serverSocket.on('error', (err) => {
      console.error('Server socket error:', err);
      clientSocket.end();
    });

    clientSocket.on('error', (err) => {
      console.error('Client socket error:', err);
      serverSocket.end();
    });
  }

  stop() {
    if (this.server) {
      this.server.close(() => {
        console.log('HTTP Proxy Server stopped');
      });
    }
  }
}

module.exports = HttpProxyServer;
