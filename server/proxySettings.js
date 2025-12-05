const {set, get} = require('./store');
const fs = require('fs');
const path = require('path');

// Separate storage for HAR data to avoid performance issues
const harDataCache = new Map(); // id -> harData

// Cache for proxy settings to avoid repeated reads
let proxySettingsCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 1000; // Cache for 1 second

const getProxySettings = () => {
  const now = Date.now();
  // Use cache if valid
  if (proxySettingsCache && (now - cacheTimestamp) < CACHE_TTL) {
    return proxySettingsCache;
  }
  
  // Read from store and update cache
  proxySettingsCache = get('proxySettings');
  cacheTimestamp = now;
  return proxySettingsCache;
};

const setProxySettings = proxySettings => {
  // Update cache
  proxySettingsCache = proxySettings;
  cacheTimestamp = Date.now();
  
  // Write to store (async to avoid blocking)
  setImmediate(() => {
    set('proxySettings', proxySettings);
  });
};

// Get HAR data by setting id
const getHarData = (settingId) => harDataCache.get(settingId);

// Set HAR data for a setting
const setHarData = (settingId, harData) => {
  if (harData) {
    harDataCache.set(settingId, harData);
  } else {
    harDataCache.delete(settingId);
  }
};

// init
if (!getProxySettings()) {
  setProxySettings([]);
}

exports.getProxySettings = getProxySettings;
exports.getHarData = getHarData;
exports.setHarData = setHarData;

// Notify listeners when settings change
const changeListeners = [];
const notifyChange = () => {
  changeListeners.forEach(listener => listener());
};

exports.onSettingsChange = (listener) => {
  changeListeners.push(listener);
};

exports.addProxySetting = (setting) => {
  setting.id = `${Date.now()}-${Math.random()}`;
  
  // Extract and store HAR data separately
  const harData = setting.harData;
  delete setting.harData; // Remove from setting object
  
  const proxySettings = getProxySettings();
  proxySettings.push(setting);
  setProxySettings(proxySettings);
  
  // Store HAR data in memory cache
  if (harData) {
    setHarData(setting.id, harData);
  }
  
  // Notify change
  notifyChange();
  
  return Promise.resolve(true);
};

exports.deleteProxySetting = (setting) => {
  const proxySettings = getProxySettings();
  setProxySettings(proxySettings.filter(s => s.id  !== setting.id));
  
  // Clean up HAR data from cache
  if (setting.id) {
    setHarData(setting.id, null);
  }
  
  // Notify change
  notifyChange();
  
  return Promise.resolve(true);
};

exports.updateProxySetting = (setting) => {
  // Extract and store HAR data separately
  const harData = setting.harData;
  delete setting.harData; // Remove from setting object
  
  const proxySettings = getProxySettings();
  const oldSetting = proxySettings.find(s => s.id  === setting.id);
  if (oldSetting) {
    // Only update changed fields to minimize serialization
    Object.assign(oldSetting, setting);
    setProxySettings(proxySettings);
    
    // Update HAR data in memory cache
    if (harData !== undefined) {
      setHarData(setting.id, harData);
    }
  }
  
  // Notify change
  notifyChange();
  
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
    notifyChange();
    return Promise.resolve(true);
  }
  
  // Move down: swap with next item
  if (direction === 'down' && index < proxySettings.length - 1) {
    [proxySettings[index], proxySettings[index + 1]] = [proxySettings[index + 1], proxySettings[index]];
    setProxySettings(proxySettings);
    notifyChange();
    return Promise.resolve(true);
  }
  
  return Promise.resolve(false);
};
