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
  // Match port only in hostname part (before first slash after protocol)
  const match = url.match(/.*?:\/\/[^/:]+:(\d+)/);
  return match ? Number(match[1]) : (getProtocol(url).toLocaleLowerCase() === 'https' ? 443 : 80);
}