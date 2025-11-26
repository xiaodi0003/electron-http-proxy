const {ipcMain} = require('electron');
const pSettings = require('./proxySettings.js');

const windows = new Set();

exports.addWindow = window => windows.add(window);

exports.removeWindow = window => windows.delete(window);

exports.serverMessage = function(channel, payload) {
  windows.forEach(window => {
    window.webContents.send(channel, JSON.stringify(payload));
  });
};

['addProxySetting', 'updateProxySetting', 'deleteProxySetting', 'moveProxySetting'].forEach(channel => {
  ipcMain.on(channel, (event, arg) => {
    pSettings[channel](JSON.parse(arg)).then(() => {
      event.sender.send('proxySettings', JSON.stringify(pSettings.getProxySettings()));
    });
  });
});


ipcMain.on('getProxySettings', (event) => {
  event.sender.send('proxySettings', JSON.stringify(pSettings.getProxySettings())); // 在main process里向web page发出message
});
