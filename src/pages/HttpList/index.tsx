import { Table } from 'antd';
import React, { useState } from 'react';
import { connect } from 'umi';
import { ConnectState, GlobalModelState, HttpPackage } from '@/models/connect';
import HttpPackageDetail from './HttpPackageDetail';
import HttpListOperation from './HttpListOperation';
import './index.less';

function getDomain(url: string) {
  return url.replace(/.*?:\/\/([^/]*).*/, '$1');
}

function getPath(url: string) {
  return url.replace(/.*?:\/\/[^/]*(.*)/, '$1');
}

function getProtocol(url: string) {
  return url.replace(/(.*?):.*/, '$1');
}

const HttpList: React.FC<{global: GlobalModelState}> = ({
  global: {
    httpPackages
  }
}) => {
  const [detail, setDetail] = useState<HttpPackage | null>(null);

  const columns = [
    {
      title: '序号',
      key: 'index',
      dataIndex: 'index',
      width: 50,
      fixed: 'left',
      render: (text: string, data: HttpPackage, i: number) => i + 1
    },
    {
      title: 'Code',
      key: 'res.statusCode',
      dataIndex: 'res.statusCode',
      width: 70,
      render: (text: string, data: HttpPackage) => data.res ? data.res.statusCode : '--'
    },
    {
      title: 'Method',
      key: 'res.method',
      dataIndex: 'res.method',
      width: 70,
      render: (text: string, data: HttpPackage) => data.req.method
    },
    {
      title: '协议',
      key: 'protocol',
      dataIndex: 'protocol',
      width: 60,
      render: (text: string, data: HttpPackage) => getProtocol(data.req.url)
    },
    {
      title: 'Host',
      key: 'domain',
      dataIndex: 'domain',
      width: 130,
      render: (text: string, data: HttpPackage) => getDomain(data.req.url)
    },
    {
      title: 'Path',
      key: 'req.url',
      dataIndex: 'req.url',
      className: 'path',
      width: 500,
      render: (text: string, data: HttpPackage) => getPath(data.req.url)
    },
    {
      title: 'Operation',
      key: 'detail',
      dataIndex: 'detail',
      width: 100,
      render: (text: string, data: HttpPackage) => <a onClick={() => setDetail(data)}>Detail</a>
    },
  ];

  console.log('httplist', httpPackages);

  return (
    <div>
      <HttpListOperation />
      <Table
        rowKey='id'
        columns={columns}
        /* table是一个pureComponent，所以只能给他传一个新对象 */
        dataSource={httpPackages}
        pagination={false}
        className='httptable'
        scroll={{ x: 'calc(100vw - 180px)', y: 'calc(100vh - 85px)' }}
      />
      <HttpPackageDetail
        detail={detail}
        getPath={getPath}
        onOk={() => setDetail(null)}
      />
    </div>
  );
};

export default connect(({ global }: ConnectState) => ({
  global,
}))(HttpList);
