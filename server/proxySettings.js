const {set, get} = require('./store');
const fs = require('fs');
const path = require('path');

// Get user data directory for storing HAR files
let HAR_DIR;
try {
  const { app } = require('electron');
  HAR_DIR = path.join(app.getPath('userData'), 'har-files');
} catch (e) {
  HAR_DIR = path.join(__dirname, '../.har-files');
}

// Ensure HAR directory exists
if (!fs.existsSync(HAR_DIR)) {
  fs.mkdirSync(HAR_DIR, { recursive: true });
}

// Simple memory cache for HAR data
const harDataCache = new Map();

// Cache for proxy settings to avoid repeated reads
let proxySettingsCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 1000;

const getProxySettings = () => {
  const now = Date.now();
  if (proxySettingsCache && (now - cacheTimestamp) < CACHE_TTL) {
    return proxySettingsCache;
  }
  
  proxySettingsCache = get('proxySettings');
  cacheTimestamp = now;
  return proxySettingsCache;
};

const setProxySettings = proxySettings => {
  proxySettingsCache = proxySettings;
  cacheTimestamp = Date.now();
  
  setImmediate(() => {
    set('proxySettings', proxySettings);
  });
};

// Get HAR file path for a setting
const getHarFilePath = (settingId) => {
  return path.join(HAR_DIR, `${settingId}.har`);
};

// Get HAR data by setting id
const getHarData = (settingId) => {
  // Check memory cache first
  if (harDataCache.has(settingId)) {
    return harDataCache.get(settingId);
  }
  
  // Load from file system
  const harFilePath = getHarFilePath(settingId);
  if (fs.existsSync(harFilePath)) {
    try {
      const harData = JSON.parse(fs.readFileSync(harFilePath, 'utf8'));
      harDataCache.set(settingId, harData);
      return harData;
    } catch (e) {
      console.error(`Failed to load HAR file for setting ${settingId}:`, e);
    }
  }
  
  return null;
};

// Set HAR data for a setting
const setHarData = (settingId, harData) => {
  const harFilePath = getHarFilePath(settingId);
  
  if (harData) {
    harDataCache.set(settingId, harData);
    
    setImmediate(() => {
      try {
        fs.writeFileSync(harFilePath, JSON.stringify(harData));
      } catch (e) {
        console.error(`Failed to save HAR file for setting ${settingId}:`, e);
      }
    });
  } else {
    harDataCache.delete(settingId);
    
    if (fs.existsSync(harFilePath)) {
      try {
        fs.unlinkSync(harFilePath);
      } catch (e) {
        console.error(`Failed to delete HAR file for setting ${settingId}:`, e);
      }
    }
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
