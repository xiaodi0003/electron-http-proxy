const { ipcRenderer } = window.require('electron');
const channelList = ['req', 'res', 'proxySettings'];

export function handleElectronMessage(dispatch) {
  channelList.forEach(channel => {
    ipcRenderer.on(channel, (event, payload) => {
      console.log(event, payload);
      if (['req', 'res'].includes(channel)) {
        dispatch({
          type: 'global/httpPackageChange',
          payload: JSON.parse(payload)
        });
      } else if (channel === 'proxySettings') {
        dispatch({
          type: 'global/proxySettingChange',
          payload: JSON.parse(payload)
        });
      }
    })
  });
}

export function sendElectronMessage({channel, payload}) {
  ipcRenderer.send(channel, JSON.stringify(payload));
}
