import { defineStore } from 'pinia';

export interface HttpPackage {
  id: string;
  req?: any;
  res?: any;
}

// Backend proxy configuration interface
export interface BackendProxyConfig {
  type: 'direct' | 'http' | 'socks5';
  host?: string;
  port?: number;
}

// Default backend proxy configuration
export const DEFAULT_BACKEND_PROXY: BackendProxyConfig = {
  type: 'direct',
};

export interface ProxySetting {
  id?: string;
  enabled: boolean;
  type: string;
  from: string;
  to: string;
  reqHook: boolean;
  reqHookCode: string;
  resHook: boolean;
  resHookCode: string;
  delay: number;
  backendProxy?: BackendProxyConfig; // Optional backend proxy configuration
  harData?: any; // HAR file data for har:// protocol
  harIgnoreParams?: string; // Comma-separated list of parameters to ignore when matching
}

export interface HttpListConfig {
  stoped: boolean;
}

export interface GlobalState {
  collapsed: boolean;
  httpPackages: HttpPackage[];
  proxySettings: ProxySetting[];
  httpListConfig: HttpListConfig;
}

export const useGlobalStore = defineStore('global', {
  state: (): GlobalState => ({
    collapsed: false,
    httpPackages: [],
    proxySettings: [],
    httpListConfig: {
      stoped: false,
    },
  }),

  actions: {
    changeLayoutCollapsed(payload: boolean) {
      this.collapsed = payload;
    },

    httpPackageChange(payload: { id: string; req?: any; res?: any }) {
      if (this.httpListConfig.stoped) {
        return;
      }

      const httpPackageTemp = this.httpPackages.find(p => p.id === payload.id);
      const httpPackage: HttpPackage = httpPackageTemp || { id: payload.id };
      
      if (payload.req) {
        httpPackage.req = payload.req;
      }
      if (httpPackage.req && payload.res) {
        httpPackage.res = payload.res;
      }
      
      // 创建了req则说明当前消息是新消息
      if (!httpPackageTemp && httpPackage.req) {
        this.httpPackages.push(httpPackage);
      }
      
      // 只保留最后500条
      if (this.httpPackages.length > 500) {
        this.httpPackages = this.httpPackages.slice(-500);
      }
    },

    httpPackageClear() {
      this.httpPackages = [];
    },

    httpPackageImport(payload: HttpPackage[]) {
      this.httpPackages.push(...payload);
      
      // Keep only last 500 items
      if (this.httpPackages.length > 500) {
        this.httpPackages = this.httpPackages.slice(-500);
      }
    },

    httpListConfigChange(payload: Partial<HttpListConfig>) {
      this.httpListConfig = { ...this.httpListConfig, ...payload };
    },

    proxySettingChange(payload: ProxySetting[]) {
      this.proxySettings = payload;
    },
  },
});
