exports.getDomain = function getDomain(url) {
  return url.replace(/.*?:\/\/([^/:]*).*/, '$1');
}

exports.getPath = function getPath(url) {
  return url.replace(/.*?:\/\/[^/]*(.*)/, '$1');
}

function getProtocol(url) {
  return url.replace(/(.*?):.*/, '$1');
}

exports.getProtocol = getProtocol;

exports.getPort = function getPort(url) {
  const match = url.match(/.*?:\/\/.*?:(\d+).*/);
  return match ? Number(match[1]) : (getProtocol(url).toLocaleLowerCase() === 'https' ? 443 : 80);
}