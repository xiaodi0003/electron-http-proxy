const fs = require('fs');
const mime = require('mime');
const path = require('path');
const {getProtocol, getPort, getDomain, getPath} = require('./utils.js');
const pSettings = require('./proxySettings.js');

// ProxyAdapter for AnyProxy to handle backend proxy
exports.proxyAdapter = {
  async createProxy(requestDetail) {
    // Find matching proxy setting using findSetting
    const setting = pSettings.getProxySettings()
      .filter(s => s.enabled)
      .find(s => findSetting(s, requestDetail));

    // Return proxy config if backend proxy is configured
    if (setting?.backendProxy) {
      const bp = setting.backendProxy;
      const proxyConfig = {
        protocol: bp.type, // 'http' or 'socks5'
        host: bp.host,
        port: parseInt(bp.port, 10)
      };
      
      // Add auth if provided
      if (bp.username && bp.password) {
        proxyConfig.auth = {
          username: bp.username,
          password: bp.password
        };
      }
      
      console.log(`Using ${bp.type} proxy for ${requestDetail.url}: ${bp.host}:${bp.port}`);
      return proxyConfig;
    }
    
    return null; // No proxy, direct connection
  }
};

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
    // Backend proxy is now handled by AnyProxy's proxyAdapter
    return exeProxy(target, requestDetail);
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
      exeProxy(url, req);
      req.requestOptions.headers = headers;
      req.requestData = body; // Buffer.from(body);
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



async function exeProxy(target, requestDetail) {
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
  
  // Backend proxy is handled by AnyProxy's proxyAdapter
  // Just update the target URL
  return handleDirectConnection(target, requestDetail);
}
