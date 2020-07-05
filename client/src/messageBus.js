export function handleElectronMessage(dispatch) {
  window.addEventListener('message', event => {
    const data = JSON.parse(event.data);
    console.log('message', data);
    if (['req', 'res'].includes(data.channel)) {
      dispatch({
        type: 'global/httpPackageChange',
        payload: data.payload
      });
    } else if (data.channel === 'proxySettings') {
      dispatch({
        type: 'global/proxySettingChange',
        payload: data.payload
      });
    }
  }, false);
}

export function sendElectronMessage({channel, payload}) {
  top.postMessage(JSON.stringify({channel, payload}), '*');
}
