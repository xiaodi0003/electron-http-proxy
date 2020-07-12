import { Table, Button } from 'antd';
import React, { useState, useEffect } from 'react';
import { connect } from 'umi';
import { ConnectState, GlobalModelState, ProxySetting } from '@/models/connect';
import SettingDetail from './SettingDetail';
import { getProxySettings, updateProxySetting, addProxySetting, deleteProxySetting } from './service';

import './index.less';

const HttpList: React.FC<{global: GlobalModelState}> = ({
  global: {
    proxySettings
  }
}) => {
  const [nowSetting, setNowSetting] = useState<ProxySetting | null>(null);

  function onSave(setting: ProxySetting) {
    if (setting) {
      if (setting.id) {
        updateProxySetting(setting);
      } else {
        addProxySetting(setting);
      }
    }
    setNowSetting(null);
  }

  useEffect(() => {
    getProxySettings();
  }, []);

  const columns = [
    {
      title: '匹配方式',
      key: 'type',
      dataIndex: 'type',
      width: 70,
      render: (text: string) => text
    },
    {
      title: 'From',
      key: 'from',
      dataIndex: 'from',
      width: 300,
      render: (text: string) => text
    },
    {
      title: 'To',
      key: 'to',
      dataIndex: 'to',
      width: 300,
      render: (text: string) => text
    },
    {
      title: '操作',
      key: 'operation',
      dataIndex: 'operation',
      width: 150,
      className: 'operations',
      render: (text: string, setting: ProxySetting) => <>
        <a onClick={() => setNowSetting(setting)}>Edit</a>
        <a onClick={() => deleteProxySetting(setting)}>Delete</a>
        <a onClick={() => setNowSetting({...setting, id: undefined})}>Copy</a>
        <a onClick={() => onSave({...setting, enabled: !setting.enabled})}>{setting.enabled ? 'Disable' : 'Enable'}</a>
      </>
    }
  ];

  return (
    <>
      <Table
        rowKey='id'
        columns={columns}
        rowClassName={record => record.enabled ? '' : 'disabled'}
        dataSource={proxySettings}
        pagination={false}
        className='dynamicproxy'
        scroll={{ x: 'calc(100vw - 180px)', y: 'calc(100vh - 163px)' }}
      />
      <Button type='primary' onClick={() => setNowSetting({})}>Add</Button>
      {nowSetting && <SettingDetail setting={nowSetting} onOk={onSave} />}
    </>
  );
};

export default connect(({ global }: ConnectState) => ({
  global,
}))(HttpList);
