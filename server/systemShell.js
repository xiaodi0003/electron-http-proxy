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

exports.setProxy = (port) => {
  exec(`networksetup -setwebproxy Wi-Fi 127.0.0.1 ${port}`);
  exec(`networksetup -setsecurewebproxy Wi-Fi 127.0.0.1 ${port}`);
  exec(`networksetup -setproxybypassdomains "Wi-Fi" 127.0.0.2`);
};

exports.deleteProxy = () => {
  exec('networksetup -setwebproxystate Wi-Fi off');
  exec('networksetup -setsecurewebproxystate Wi-Fi off');
  /* exec('networksetup -setsocksfirewallproxystate Wi-Fi off');
  exec('networksetup -setautoproxystate Wi-Fi off'); */
};

exports.startClient = (port) => {
  exec(`cd ./client ./node_modules/.bin/cross-env PORT=${port} ./node_modules/.bin/react-app-rewired start --color nohup &`);
};
