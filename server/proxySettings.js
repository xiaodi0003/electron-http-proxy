const {set, get} = require('./store');

const getProxySettings = () => get('proxySettings');
const setProxySettings = proxySettings => set('proxySettings', proxySettings);

// init
if (!getProxySettings()) {
  setProxySettings([]);
}

exports.getProxySettings = getProxySettings;

exports.addProxySetting = (setting) => {
  setting.id = `${Date.now()}-${Math.random()}`;
  const proxySettings = getProxySettings();
  proxySettings.push(setting);
  setProxySettings(proxySettings);
  return Promise.resolve(true);
};

exports.deleteProxySetting = (setting) => {
  const proxySettings = getProxySettings();
  setProxySettings(proxySettings.filter(s => s.id  !== setting.id));
  return Promise.resolve(true);
};

exports.updateProxySetting = (setting) => {
  const proxySettings = getProxySettings();
  const oldSetting = proxySettings.find(s => s.id  === setting.id);
  if (oldSetting) {
    Object.assign(oldSetting, setting);
    setProxySettings(proxySettings);
  }
  return Promise.resolve(true);
};

exports.moveProxySetting = ({ setting, direction }) => {
  const proxySettings = getProxySettings();
  const index = proxySettings.findIndex(s => s.id === setting.id);
  
  if (index === -1) {
    return Promise.resolve(false);
  }
  
  // Move up: swap with previous item
  if (direction === 'up' && index > 0) {
    [proxySettings[index - 1], proxySettings[index]] = [proxySettings[index], proxySettings[index - 1]];
    setProxySettings(proxySettings);
    return Promise.resolve(true);
  }
  
  // Move down: swap with next item
  if (direction === 'down' && index < proxySettings.length - 1) {
    [proxySettings[index], proxySettings[index + 1]] = [proxySettings[index + 1], proxySettings[index]];
    setProxySettings(proxySettings);
    return Promise.resolve(true);
  }
  
  return Promise.resolve(false);
};
