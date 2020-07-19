import { ClearOutlined, PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import React from 'react';
import { connect, Dispatch } from 'umi';
import { ConnectState, GlobalModelState } from '@/models/connect';
import './index.less';

const HttpListOperation: React.FC<{global: GlobalModelState; dispatch: Dispatch}> = ({
  global: {
    httpListConfig
  },
  dispatch
}) => {
  const {stoped} = httpListConfig;

  function changeStoped() {
    dispatch({
      type: 'global/httpListConfigChange',
      payload: {
        stoped: !stoped
      }
    });
  }

  function clear() {
    dispatch({
      type: 'global/httpPackageClear'
    });
  }

  return (
    <div className='httplist-operation'>
      {stoped 
        ? <Tooltip title='启动'>
          <PlayCircleOutlined onClick={changeStoped} />
        </Tooltip>
        : <Tooltip title='暂停'>
          <PauseCircleOutlined onClick={changeStoped} />
        </Tooltip>}
        <Tooltip title='清空'>
          <ClearOutlined onClick={clear} />
        </Tooltip>
    </div>
  );
};

export default connect(({ global }: ConnectState) => ({
  global,
}))(HttpListOperation);
