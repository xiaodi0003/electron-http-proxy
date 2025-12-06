const { set, get } = require('./store');
const { getActiveNetworkServices } = require('./systemShell');
const process = require('child_process');

const getWhitelist = () => get('whitelist') || [];

const setWhitelist = (whitelist) => set('whitelist', whitelist);

// Initialize
if (!get('whitelist')) {
  setWhitelist([]);
}

exports.getWhitelist = getWhitelist;

exports.addWhitelistItem = (item) => {
  item.id = `${Date.now()}-${Math.random()}`;
  const whitelist = getWhitelist();
  whitelist.push(item);
  setWhitelist(whitelist);
  updateSystemProxyBypass();
  return Promise.resolve(true);
};

exports.deleteWhitelistItem = (item) => {
  const whitelist = getWhitelist();
  setWhitelist(whitelist.filter((w) => w.id !== item.id));
  updateSystemProxyBypass();
  return Promise.resolve(true);
};

exports.updateWhitelistItem = (item) => {
  const whitelist = getWhitelist();
  const oldItem = whitelist.find((w) => w.id === item.id);
  if (oldItem) {
    Object.assign(oldItem, item);
    setWhitelist(whitelist);
    updateSystemProxyBypass();
  }
  return Promise.resolve(true);
};

// Update system proxy bypass domains
async function updateSystemProxyBypass() {
  const enabledDomains = getWhitelist()
    .filter((item) => item.enabled)
    .map((item) => item.domain);

  // Only update if there are enabled domains
  if (enabledDomains.length === 0) {
    console.log('No enabled whitelist domains, skipping system update');
    return;
  }

  const services = await getActiveNetworkServices();
  const bypassDomains = enabledDomains.join(' ');

  services.forEach((service) => {
    const cmd = `networksetup -setproxybypassdomains "${service}" ${bypassDomains}`;
    process.exec(cmd, (error) => {
      if (error) console.error(`Failed to update bypass for ${service}:`, error);
    });
  });
}

exports.updateSystemProxyBypass = updateSystemProxyBypass;

// Get current system proxy bypass domains
async function getSystemProxyBypass() {
  const services = await getActiveNetworkServices();
  const bypassDomains = {};

  for (const service of services) {
    await new Promise((resolve) => {
      const cmd = `networksetup -getproxybypassdomains "${service}"`;
      process.exec(cmd, (error, stdout) => {
        if (!error && stdout) {
          const domains = stdout
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line && !line.startsWith('There'));
          if (domains.length > 0) {
            bypassDomains[service] = domains;
          }
        }
        resolve();
      });
    });
  }

  return bypassDomains;
}

exports.getSystemProxyBypass = getSystemProxyBypass;

// Sync whitelist with system on startup
async function syncWithSystem() {
  const systemBypass = await getSystemProxyBypass();
  const whitelist = getWhitelist();
  
  // Collect all system domains
  const systemDomains = new Set();
  Object.values(systemBypass).forEach((domains) => {
    domains.forEach((domain) => systemDomains.add(domain));
  });
  
  // Update whitelist items based on system state
  let hasChanges = false;
  whitelist.forEach((item) => {
    const isInSystem = systemDomains.has(item.domain);
    if (item.enabled && !isInSystem) {
      // Item is enabled in app but not in system, disable it
      item.enabled = false;
      hasChanges = true;
      console.log(`Disabled whitelist item not in system: ${item.domain}`);
    } else if (!item.enabled && isInSystem) {
      // Item is disabled in app but exists in system, enable it
      item.enabled = true;
      hasChanges = true;
      console.log(`Enabled whitelist item found in system: ${item.domain}`);
    }
  });
  
  // Add system domains that are not in whitelist
  const whitelistDomains = new Set(whitelist.map((item) => item.domain));
  systemDomains.forEach((domain) => {
    if (!whitelistDomains.has(domain)) {
      whitelist.push({
        id: `${Date.now()}-${Math.random()}`,
        enabled: true,
        domain: domain,
      });
      hasChanges = true;
      console.log(`Added system domain to whitelist: ${domain}`);
    }
  });
  
  if (hasChanges) {
    setWhitelist(whitelist);
    console.log('Whitelist synced with system');
  }
}

exports.syncWithSystem = syncWithSystem;
