const fs = require('fs');
const mime = require('mime');
const path = require('path');
const {getProtocol, getPort, getDomain, getPath} = require('./utils.js');
const pSettings = require('./proxySettings.js');

async function sleep(setting) {
  if (setting && setting.delay && !isNaN(setting.delay)) {
    return new Promise(r => {
      setTimeout(() => r(true), setting.delay);
    });
  }
  return true;
}

function discernLocalhost(req) {
  const options = req.requestOptions;
  if (options.hostname === 'll') {
    options.hostname = 'localhost';
  }
}

exports.proxyReq = async function(requestDetail) {
  discernLocalhost(requestDetail);
  const setting = pSettings.getProxySettings().filter(s => s.enabled).find(s => findSetting(s, requestDetail));
  if (setting) {
    requestDetail._req.proxySetting = setting;
    await sleep(setting)
    if (setting.reqHook) {
      return doReqHook(setting, requestDetail);
    }
    const target = getTarget(setting, requestDetail);
    const backendProxy = setting.backendProxy;
    return exeProxy(target, requestDetail, backendProxy);
  }
  return requestDetail;
}

exports.proxyRes = function(requestDetail, responseDetail) {
  const setting = requestDetail._req && requestDetail._req.proxySetting;
  if (setting) {
    if (setting.resHook) {
      return doResHook(setting, requestDetail, responseDetail);
    }
  }
  return responseDetail;
}

function findSetting(setting, req) {
  const {type, from} = setting;
    
  switch(type) {
    case 'exact':
      if (req.url === from) {
        return true;
      }
      break;
    case 'prefix':
      if (req.url.startsWith(from)) {
        return true;
      }
      break;
    case 'regex':
      if (new RegExp(from).test(req.url)) {
        return true;
      }
      break;
    default:
      break;
  }
  return false;
}

function getTarget(setting, req) {
  const {type, from, to} = setting;

  switch(type) {
    case 'exact':
    case 'prefix':
      return req.url.replace(from, to);
    case 'regex':
      return req.url.replace(new RegExp(from), to);
    default:
      break;
  }
  return req.url;
}

async function doReqHook(setting, req) {
  try {
    reqHook = null;
    eval(setting.reqHookCode);
    if ('function' === typeof reqHook) {
      const {url, headers, body} = await reqHook({
        url: req.url,
        headers: req.requestOptions.headers,
        body: req.requestData.toString()
      });
      // Apply the modified URL, headers, and body
      req.url = url;
      req.requestOptions.headers = headers;
      req.requestData = body; // Buffer.from(body);
      
      // Execute proxy with backend proxy configuration
      const target = url;
      const backendProxy = setting.backendProxy;
      return await exeProxy(target, req, backendProxy);
    }
  } catch (e) {
    console.error(e);
  }
  return req;
}

async function doResHook(setting, req, res) {
  try {
    resHook = null;
    eval(setting.resHookCode);
    if ('function' === typeof resHook) {
      const {code, headers, body} = await resHook({
        url: req.url,
        headers: req.requestOptions.headers,
        body: req.requestData.toString()
      }, {
        code: res.response.statusCode,
        headers: res.response.header,
        body: res.response.body.toString()
      });
      res.response.statusCode = code;
      res.response.header = headers;
      res.response.body = body;
    }
  } catch (e) {
    console.error(e);
  }
  return res;
}

// Handle direct connection to target server without any proxy
function handleDirectConnection(target, requestDetail) {
  const newRequestOptions = requestDetail.requestOptions;
  requestDetail.protocol = getProtocol(target);
  newRequestOptions.hostname = getDomain(target);
  newRequestOptions.port = getPort(target);
  newRequestOptions.path = getPath(target);
  newRequestOptions.headers.Host = newRequestOptions.hostname;
  newRequestOptions.headers.Origin = requestDetail.protocol + '://' + newRequestOptions.hostname;
  return requestDetail;
}

// Handle HTTP proxy connection by forwarding through proxy server
function handleHttpProxy(target, requestDetail, backendProxy) {
  try {
    const targetProtocol = getProtocol(target);
    const targetHostname = getDomain(target);
    const targetPort = getPort(target);
    const targetPath = getPath(target);

    console.log(`Request ${target} using HTTP proxy: ${backendProxy.host}:${backendProxy.port}`);

    const newRequestOptions = requestDetail.requestOptions;
    
    // For HTTP proxy, we need to:
    // 1. Connect to the proxy server (not the target)
    // 2. Send the full URL in the request path (not just the path)
    requestDetail.protocol = 'http:';
    newRequestOptions.hostname = backendProxy.host;
    newRequestOptions.port = backendProxy.port;
    
    // For HTTP proxy, the path should be the full target URL
    newRequestOptions.path = target;
    
    // Keep the original host header for the target server
    // newRequestOptions.headers.host = targetHostname;
    newRequestOptions.headers.Host = targetHostname;
    newRequestOptions.headers.Origin = targetProtocol + '://' + targetHostname;
    // newRequestOptions.headers.Referer = target;

    // Add proxy authentication if provided
    if (backendProxy.username && backendProxy.password) {
      const auth = Buffer.from(`${backendProxy.username}:${backendProxy.password}`).toString('base64');
      newRequestOptions.headers['Proxy-Authorization'] = `Basic ${auth}`;
    }

    return requestDetail;
  } catch (err) {
    console.error('HTTP Proxy setup failed:', err);
    return {
      response: {
        statusCode: 502,
        header: { 'Content-Type': 'text/plain' },
        body: `HTTP Proxy setup failed: ${err.message}`
      }
    };
  }
}

// Handle SOCKS5 proxy connection by forwarding through SOCKS5 server
async function handleSocks5Proxy(target, requestDetail, backendProxy) {
  try {
    const http = require('http');
    const https = require('https');
    const { SocksClient } = require('socks');
    
    const targetProtocol = getProtocol(target);
    const targetHostname = getDomain(target);
    const targetPort = getPort(target);
    const targetPath = getPath(target);

    console.log(`Request ${target} using SOCKS5 proxy: ${backendProxy.host}:${backendProxy.port}`);

    const newRequestOptions = requestDetail.requestOptions;

    // For SOCKS5 proxy, we need to:
    // 1. Establish SOCKS5 connection to proxy server
    // 2. Use the socket to connect to target server
    const socksOptions = {
      proxy: {
        host: backendProxy.host,
        port: backendProxy.port,
        type: 5,
        userId: backendProxy.username,
        password: backendProxy.password
      },
      command: 'connect',
      destination: {
        host: targetHostname,
        port: targetPort
      },
      timeout: 30000
    };

    // Establish SOCKS5 connection
    const socksConnection = await SocksClient.createConnection(socksOptions);

    // Update request options to target server
    requestDetail.protocol = targetProtocol;
    newRequestOptions.hostname = targetHostname;
    newRequestOptions.port = targetPort;
    newRequestOptions.path = targetPath;
    newRequestOptions.headers.Host = targetHostname;
    newRequestOptions.headers.Origin = targetProtocol + '://' + targetHostname;

    // Create agent with the SOCKS socket
    const Agent = targetProtocol === 'https:' ? https.Agent : http.Agent;
    newRequestOptions.agent = new Agent({
      socket: socksConnection.socket,
      keepAlive: false
    });

    return requestDetail;
  } catch (err) {
    console.error('SOCKS5 Proxy connection failed:', err);
    return {
      response: {
        statusCode: 502,
        header: { 'Content-Type': 'text/plain' },
        body: `SOCKS5 Proxy connection failed: ${err.message}`
      }
    };
  }
}

async function exeProxy(target, requestDetail, backendProxy) {
  // Handle file:// protocol
  if (target.startsWith('file://')) {
    return new Promise(resolve => {
      const fileName = target.replace('file://', '/').replace(/\?.*/, '');
      fs.readFile(fileName, function(err,data) {
        if(err) {
          resolve({
            response: {
              statusCode: 404,
              header: { 'Content-Type': 'text/plain' },
              body: err.message
            }
          });
        } else {
          resolve({
            response: {
              statusCode: 200,
              header: { 'Content-Type': mime.getType(path.basename(fileName)) },
              body: data
            }
          });
        }
      });
    });
  }
  
  // Handle http/https protocols based on backend proxy configuration
  if (backendProxy?.type === 'http') {
    return handleHttpProxy(target, requestDetail, backendProxy);
  } else if (backendProxy?.type === 'socks5') {
    return await handleSocks5Proxy(target, requestDetail, backendProxy);
  }
  
  // Default to direct connection
  return handleDirectConnection(target, requestDetail);
}
