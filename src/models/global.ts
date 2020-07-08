import { Subscription, Reducer, Effect } from 'umi';

import { NoticeIconData } from '@/components/NoticeIcon';
import { ConnectState } from './connect.d';

export interface NoticeItem extends NoticeIconData {
  id: string;
  type: string;
  status: string;
}

export interface HttpPackage {
  id: string,
  req?: any,
  res?: any,
}

export interface ProxySetting {
  id: string,
  enabled: boolean,
  type: string,
  from: string,
  to: string
}

export interface GlobalModelState {
  collapsed: boolean;
  notices: NoticeItem[];
  httpPackages?: HttpPackage[];
  proxySettings: ProxySetting[];
}

export interface GlobalModelType {
  namespace: 'global';
  state: GlobalModelState;
  effects: {
    fetchNotices: Effect;
    clearNotices: Effect;
    changeNoticeReadState: Effect;
  };
  reducers: {
    changeLayoutCollapsed: Reducer<GlobalModelState>;
    saveNotices: Reducer<GlobalModelState>;
    saveClearedNotices: Reducer<GlobalModelState>;
    httpPackageChange: Reducer<GlobalModelState>;
  };
  subscriptions: { setup: Subscription };
}

const GlobalModel: GlobalModelType = {
  namespace: 'global',

  state: {
    collapsed: false,
    notices: [],
    httpPackages: [],
    proxySettings: []
  },

  effects: {
    *fetchNotices(_, { call, put, select }) {
      const data = yield call(queryNotices);
      yield put({
        type: 'saveNotices',
        payload: data,
      });
      const unreadCount: number = yield select(
        (state: ConnectState) => state.global.notices.filter((item) => !item.read).length,
      );
      yield put({
        type: 'user/changeNotifyCount',
        payload: {
          totalCount: data.length,
          unreadCount,
        },
      });
    },
    *clearNotices({ payload }, { put, select }) {
      yield put({
        type: 'saveClearedNotices',
        payload,
      });
      const count: number = yield select((state: ConnectState) => state.global.notices.length);
      const unreadCount: number = yield select(
        (state: ConnectState) => state.global.notices.filter((item) => !item.read).length,
      );
      yield put({
        type: 'user/changeNotifyCount',
        payload: {
          totalCount: count,
          unreadCount,
        },
      });
    },
    *changeNoticeReadState({ payload }, { put, select }) {
      const notices: NoticeItem[] = yield select((state: ConnectState) =>
        state.global.notices.map((item) => {
          const notice = { ...item };
          if (notice.id === payload) {
            notice.read = true;
          }
          return notice;
        }),
      );

      yield put({
        type: 'saveNotices',
        payload: notices,
      });

      yield put({
        type: 'user/changeNotifyCount',
        payload: {
          totalCount: notices.length,
          unreadCount: notices.filter((item) => !item.read).length,
        },
      });
    },
  },

  reducers: {
    changeLayoutCollapsed(state = { notices: [], collapsed: true }, { payload }): GlobalModelState {
      return {
        ...state,
        collapsed: payload,
      };
    },
    saveNotices(state, { payload }): GlobalModelState {
      return {
        collapsed: false,
        ...state,
        notices: payload,
      };
    },
    saveClearedNotices(state = { notices: [], collapsed: true }, { payload }): GlobalModelState {
      return {
        ...state,
        collapsed: false,
        notices: state.notices.filter((item): boolean => item.type !== payload),
      };
    },
    httpPackageChange(state = { notices: [], collapsed: true, httpPackages: []}, { payload }): GlobalModelState {
      const {httpPackages = []} = state;
      const httpPackageTemp = httpPackages.find(p => p.id === payload.id);
      const httpPackage: HttpPackage = httpPackageTemp || {id: payload.id};
      if (payload.req) {
        httpPackage.req = payload.req;
      }
      if (httpPackage.req && payload.res) {
        httpPackage.res = payload.res;
      }
      // 创建了req则说明当前消息是新消息
      if (!httpPackageTemp && httpPackage.req) {
        httpPackages.push(httpPackage);
      }
      return {
        ...state,
        httpPackages: [...httpPackages]
      };
    },
    proxySettingChange(stateArg = state, { payload }): GlobalModelState {
      return {
        ...stateArg,
        proxySettings: payload
      };
    },
  },

  subscriptions: {
    setup({ history }): void {
      // Subscribe history(url) change, trigger `load` action if pathname is `/`
      history.listen(({ pathname, search }): void => {
        if (typeof window.ga !== 'undefined') {
          window.ga('send', 'pageview', pathname + search);
        }
      });
    },
  },
};

export default GlobalModel;
