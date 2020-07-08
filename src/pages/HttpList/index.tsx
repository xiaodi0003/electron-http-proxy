import { Table } from 'antd';
import React, { useState } from 'react';
import { PageHeaderWrapper } from '@ant-design/pro-layout';
import { connect } from 'umi';
import { ConnectState, GlobalModelState, HttpPackage } from '@/models/connect';
import HttpPackageDetail from './HttpPackageDetail';
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
      width: 70,
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
      width: 90,
      render: (text: string, data: HttpPackage) => data.req.method
    },
    {
      title: '协议',
      key: 'protocol',
      dataIndex: 'protocol',
      width: 80,
      render: (text: string, data: HttpPackage) => getProtocol(data.req.url)
    },
    {
      title: 'Host',
      key: 'domain',
      dataIndex: 'domain',
      width: 150,
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
      width: 200,
      render: (text: string, data: HttpPackage) => <a onClick={() => setDetail(data)}>Detail</a>
    },
  ];

  return (
    <PageHeaderWrapper>
      <Table
        rowKey='id'
        columns={columns}
        /* table是一个pureComponent，所以只能给他传一个新对象 */
        dataSource={httpPackages}
        pagination={false}
        className='httptable'
        scroll={{ x: 'calc(100vw - 180px)', y: 'calc(100vh - 119px)' }}
      />
      <HttpPackageDetail
        detail={detail}
        getPath={getPath}
        onOk={() => setDetail(null)}
      />
    </PageHeaderWrapper>
  );
};

export default connect(({ global }: ConnectState) => ({
  global,
}))(HttpList);
