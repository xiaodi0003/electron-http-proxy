import { WhitelistItem } from '../stores/global';
import { sendElectronMessage } from '../utils/electron';

export async function getWhitelist() {
  return sendElectronMessage({ channel: 'getWhitelist' });
}

export async function addWhitelistItem(item: WhitelistItem) {
  return sendElectronMessage({ channel: 'addWhitelistItem', payload: item });
}

export async function deleteWhitelistItem(item: WhitelistItem) {
  return sendElectronMessage({ channel: 'deleteWhitelistItem', payload: item });
}

export async function updateWhitelistItem(item: WhitelistItem) {
  return sendElectronMessage({ channel: 'updateWhitelistItem', payload: item });
}

export async function getSystemProxyBypass() {
  return sendElectronMessage({ channel: 'getSystemProxyBypass' });
}
