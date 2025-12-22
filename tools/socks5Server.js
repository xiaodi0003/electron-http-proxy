const net = require('net');

/**
 * SOCKS5 Proxy Server Implementation
 * Supports CONNECT command for TCP connections
 */
class Socks5Server {
  constructor(options = {}) {
    this.port = options.port || 1080;
    this.host = options.host || '0.0.0.0';
    this.server = null;
    this.auth = options.auth || null; // { username, password }
  }

  start() {
    this.server = net.createServer((clientSocket) => {
      this.handleConnection(clientSocket);
    });

    this.server.listen(this.port, this.host, () => {
      console.log(`SOCKS5 proxy server listening on ${this.host}:${this.port}`);
    });

    this.server.on('error', (err) => {
      console.error('SOCKS5 server error:', err);
    });

    return this.server;
  }

  stop() {
    if (this.server) {
      this.server.close();
      console.log('SOCKS5 proxy server stopped');
    }
  }

  handleConnection(clientSocket) {
    let stage = 0; // 0: greeting, 1: auth, 2: request

    clientSocket.on('data', (data) => {
      try {
        if (stage === 0) {
          this.handleGreeting(clientSocket, data);
          stage = this.auth ? 1 : 2;
        } else if (stage === 1) {
          this.handleAuth(clientSocket, data);
          stage = 2;
        } else if (stage === 2) {
          this.handleRequest(clientSocket, data);
          stage = 3;
        }
      } catch (err) {
        console.error('Error handling SOCKS5 connection:', err);
        clientSocket.end();
      }
    });

    clientSocket.on('error', (err) => {
      console.error('Client socket error:', err);
    });
  }

  handleGreeting(clientSocket, data) {
    // SOCKS5 greeting: [VER, NMETHODS, METHODS...]
    const version = data[0];
    
    if (version !== 0x05) {
      clientSocket.end();
      return;
    }

    // Response: [VER, METHOD]
    // METHOD: 0x00 = No authentication, 0x02 = Username/Password
    const method = this.auth ? 0x02 : 0x00;
    clientSocket.write(Buffer.from([0x05, method]));
  }

  handleAuth(clientSocket, data) {
    // Auth request: [VER, ULEN, UNAME, PLEN, PASSWD]
    const version = data[0];
    
    if (version !== 0x01) {
      clientSocket.end();
      return;
    }

    const usernameLen = data[1];
    const username = data.slice(2, 2 + usernameLen).toString();
    const passwordLen = data[2 + usernameLen];
    const password = data.slice(3 + usernameLen, 3 + usernameLen + passwordLen).toString();

    // Verify credentials
    const success = this.auth && 
                   this.auth.username === username && 
                   this.auth.password === password;

    // Response: [VER, STATUS]
    clientSocket.write(Buffer.from([0x01, success ? 0x00 : 0x01]));

    if (!success) {
      clientSocket.end();
    }
  }

  handleRequest(clientSocket, data) {
    // SOCKS5 request: [VER, CMD, RSV, ATYP, DST.ADDR, DST.PORT]
    const version = data[0];
    const cmd = data[1];
    const addressType = data[3];

    if (version !== 0x05) {
      this.sendReply(clientSocket, 0x01); // General failure
      return;
    }

    if (cmd !== 0x01) {
      // Only support CONNECT command
      this.sendReply(clientSocket, 0x07); // Command not supported
      return;
    }

    let targetHost;
    let targetPort;
    let offset;

    // Parse destination address
    if (addressType === 0x01) {
      // IPv4
      targetHost = `${data[4]}.${data[5]}.${data[6]}.${data[7]}`;
      targetPort = data.readUInt16BE(8);
      offset = 10;
    } else if (addressType === 0x03) {
      // Domain name
      const domainLen = data[4];
      targetHost = data.slice(5, 5 + domainLen).toString();
      targetPort = data.readUInt16BE(5 + domainLen);
      offset = 7 + domainLen;
    } else if (addressType === 0x04) {
      // IPv6
      const ipv6Parts = [];
      for (let i = 0; i < 16; i += 2) {
        ipv6Parts.push(data.readUInt16BE(4 + i).toString(16));
      }
      targetHost = ipv6Parts.join(':');
      targetPort = data.readUInt16BE(20);
      offset = 22;
    } else {
      this.sendReply(clientSocket, 0x08); // Address type not supported
      return;
    }

    // Connect to target
    this.connectToTarget(clientSocket, targetHost, targetPort);
  }

  connectToTarget(clientSocket, targetHost, targetPort) {
    const targetSocket = net.connect(targetPort, targetHost, () => {
      // Connection successful
      this.sendReply(clientSocket, 0x00);

      // Pipe data between client and target
      clientSocket.pipe(targetSocket);
      targetSocket.pipe(clientSocket);
    });

    targetSocket.on('error', (err) => {
      console.error(`Error connecting to ${targetHost}:${targetPort}:`, err.message);
      this.sendReply(clientSocket, 0x05); // Connection refused
      clientSocket.end();
    });

    clientSocket.on('close', () => {
      targetSocket.end();
    });

    targetSocket.on('close', () => {
      clientSocket.end();
    });
  }

  sendReply(clientSocket, status) {
    // SOCKS5 reply: [VER, REP, RSV, ATYP, BND.ADDR, BND.PORT]
    const reply = Buffer.from([
      0x05, // VER
      status, // REP
      0x00, // RSV
      0x01, // ATYP (IPv4)
      0x00, 0x00, 0x00, 0x00, // BND.ADDR
      0x00, 0x00 // BND.PORT
    ]);
    clientSocket.write(reply);
  }
}

module.exports = Socks5Server;
