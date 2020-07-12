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
