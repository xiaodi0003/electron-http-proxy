const { ipcRenderer } = (window as any).require('electron');
const channelList = ['req', 'res', 'proxySettings'];

export function handleElectronMessage(callback: (channel: string, payload: any) => void) {
  channelList.forEach(channel => {
    ipcRenderer.on(channel, (event: any, payload: string) => {
      callback(channel, JSON.parse(payload));
    });
  });
}

export function sendElectronMessage({ channel, payload }: { channel: string; payload?: any }) {
  ipcRenderer.send(channel, JSON.stringify(payload));
}
