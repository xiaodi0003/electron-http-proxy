const process = require('child_process');

function exec(cmd) {
  console.log('cmd:', cmd);
  process.exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.log(`error::${error}`);
    }
    if (stdout) {
      console.log(`stdout::${stdout}`);
    }
    if (stderr) {
      console.log(`stderr::${stderr}`);
    }
  });
}

// Get all active network services
function getActiveNetworkServices() {
  return new Promise((resolve) => {
    process.exec('networksetup -listallnetworkservices', (error, stdout) => {
      if (error) {
        console.error('Failed to get network services:', error);
        resolve(['Wi-Fi', 'Ethernet']); // Fallback to common services
        return;
      }
      
      // Parse output and filter out the header line
      const services = stdout
        .split('\n')
        .filter(line => line && !line.startsWith('An asterisk') && line.trim())
        .map(line => line.trim());
      
      console.log('Available network services:', services);
      resolve(services.length > 0 ? services : ['Wi-Fi', 'Ethernet']);
    });
  });
}

exports.setProxy = async (port) => {
  const services = await getActiveNetworkServices();
  
  // Apply proxy settings to all network services
  services.forEach(service => {
    exec(`networksetup -setwebproxy "${service}" 127.0.0.1 ${port}`);
    exec(`networksetup -setsecurewebproxy "${service}" 127.0.0.1 ${port}`);
    // Clear bypass domains to ensure localhost requests go through proxy
    exec(`networksetup -setproxybypassdomains "${service}" ""`);
  });
};

exports.deleteProxy = async () => {
  const services = await getActiveNetworkServices();
  
  // Disable proxy for all network services
  services.forEach(service => {
    exec(`networksetup -setwebproxystate "${service}" off`);
    exec(`networksetup -setsecurewebproxystate "${service}" off`);
  });
};

exports.startClient = (port) => {
  exec(`cd ./client ./node_modules/.bin/cross-env PORT=${port} ./node_modules/.bin/react-app-rewired start --color nohup &`);
};
