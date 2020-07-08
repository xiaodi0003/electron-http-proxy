// Modules to control application life and create native browser window
const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');
const childProcess = require('child_process');
const systemShell = require('./systemShell');
const server = require('./server.js');
const portIsOccupied = require('./port.js');
const {addWindow, removeWindow} = require('./messageBus.js');

const serverPort = 8000;

function createWindow() {
  const startUrl = process.env.PORT ? `http://localhost:${process.env.PORT}/` : url.format({
    pathname: path.join(__dirname, '../build/index.html'),
    protocol: 'file:',
    slashes: true,
  });

  const mainWindow = new BrowserWindow({ 
    width: 1366,
    height: 800,
    webPreferences: {
      // preload: path.join(__dirname, '../static/preload.js'),
      /* 禁用webpage的require检查 */
      nodeIntegration: true,
      // 只应该在dev模式为false
      webSecurity: true
    }
  });
  mainWindow.loadURL(startUrl);

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  addWindow(mainWindow);
  mainWindow.on("closed", () => removeWindow(mainWindow));
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  const clientPort = await portIsOccupied(3000);
  // systemShell.startClient(clientPort);
  
  createWindow();

  /* 启动的时候设置系统代理，启动httpserver */
  systemShell.setProxy(serverPort);
  server.start(serverPort);

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (childProcess.platform !== 'darwin') app.quit();
});

/* 程序退出时关掉系统代理 */
app.on('before-quit', () => systemShell.deleteProxy());

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
