const pSettings = require('./proxySettings.js');

exports.proxy = function(req, res, proxy) {
  const setting = pSettings.getProxySettings().find(s => findSetting(s, req));
  if (setting) {
    const target = getTarget(setting, req);
    exeProxy(target, req, res, proxy);
  }
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
function exeProxy(target, req, res, proxy) {
  if (target.startsWith('file://')) {
    res.sendFile(target.replace('file://', '/').replace(/\?.*/, ''));
  } else {
    proxy.web(req, res, { target: req.url.replace(/(https?:\/\/[^/]*).*/, '$1') });
  }
}
