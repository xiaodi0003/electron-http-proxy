// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

window.electron = require('electron');

const channelList = ['req', 'res', 'proxySettings'];

function loadIframe() {
  const iframe = document.createElement("iframe");
  iframe.id = 'iframe';
  iframe.src = 'http://localhost:8001/';
  iframe.onload = onIframeLoaded;
  document.body.appendChild(iframe);
  
  function onIframeLoaded() {
    const {ipcRenderer} = electron;
    channelList.forEach(channel => {
      ipcRenderer.on(channel, (event, payload)=>{
        const data = {
          channel,
          payload: JSON.parse(payload)
        };
        iframe.contentWindow.postMessage(JSON.stringify(data), '*');
      })
    });

    window.addEventListener('message', event => {
      const {channel, payload = {}} = JSON.parse(event.data);
      ipcRenderer.send(channel, JSON.stringify(payload));
    }, false);
  }
}

loadIframe();
