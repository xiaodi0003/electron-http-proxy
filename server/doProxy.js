const fs = require('fs');
const mime = require('mime');
const path = require('path');
const {getProtocol, getPort, getDomain, getPath} = require('./utils.js');
const pSettings = require('./proxySettings.js');

exports.proxy = function(requestDetail) {
  const setting = pSettings.getProxySettings().filter(s => s.enabled).find(s => findSetting(s, requestDetail));
  if (setting) {
    const target = getTarget(setting, requestDetail);
    return exeProxy(target, requestDetail);
  }
  return requestDetail;
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
      if (new RegExp(from).test(from)) {
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

// todo 对于file协议，需要把结果发到页面抓包
function exeProxy(target, requestDetail) {
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
  } else {
    const newRequestOptions = requestDetail.requestOptions;
    requestDetail.protocol = getProtocol(target);
    newRequestOptions.hostname = getDomain(target);
    newRequestOptions.port = getPort(target);
    newRequestOptions.path = getPath(target);
  }
  return requestDetail;
}
