import {sendElectronMessage } from '../../messageBus';
import { ProxySetting } from '@/models/connect';

export async function getProxySettings() {
  return sendElectronMessage({channel: 'getProxySettings'});
}

export async function addProxySetting(setting: ProxySetting) {
  return sendElectronMessage({channel: 'addProxySetting', payload: setting});
}

export async function deleteProxySetting(setting: ProxySetting) {
  return sendElectronMessage({channel: 'deleteProxySetting', payload: setting});
}

export async function updateProxySetting(setting: ProxySetting) {
  return sendElectronMessage({channel: 'updateProxySetting', payload: setting});
}
