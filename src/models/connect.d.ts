import { MenuDataItem, Settings as ProSettings } from '@ant-design/pro-layout';
import { GlobalModelState, HttpPackage, ProxySetting } from './global';

export { GlobalModelState, HttpPackage, ProxySetting };

export interface Loading {
  global: boolean;
  effects: { [key: string]: boolean | undefined };
  models: {
    global?: boolean;
    menu?: boolean;
    setting?: boolean;
    user?: boolean;
    login?: boolean;
  };
}

export interface ConnectState {
  global: GlobalModelState;
  loading: Loading;
  settings: ProSettings;
  user: UserModelState;
  login: StateType;
}

export interface Route extends MenuDataItem {
  routes?: Route[];
}
