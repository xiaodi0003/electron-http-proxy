import { BypassListItem } from '../stores/global';
import { sendElectronMessage } from '../utils/electron';

export async function getBypassList() {
  return sendElectronMessage({ channel: 'getBypassList' });
}

export async function addBypassListItem(item: BypassListItem) {
  return sendElectronMessage({ channel: 'addBypassListItem', payload: item });
}

export async function deleteBypassListItem(item: BypassListItem) {
  return sendElectronMessage({ channel: 'deleteBypassListItem', payload: item });
}

export async function updateBypassListItem(item: BypassListItem) {
  return sendElectronMessage({ channel: 'updateBypassListItem', payload: item });
}

export async function getSystemProxyBypass() {
  return sendElectronMessage({ channel: 'getSystemProxyBypass' });
}
