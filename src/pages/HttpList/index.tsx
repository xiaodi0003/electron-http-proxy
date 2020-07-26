// import { Table } from 'antd';
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

  return (
    <div>
      <HttpListOperation />
      <div className='httptable'>
        <table>
          <tbody>
            <tr>
              <th>序号</th>
              <th>Code</th>
              <th>Method</th>
              <th>协议</th>
              <th>Host</th>
              <th>Path</th>
              <th>Operation</th>
            </tr>
            {/* todo 列头固定 */}
            {httpPackages?.map((data, i) => (
              <tr key={data.id}>
                <td>{i + 1}</td>
                <td>{data.res ? data.res.statusCode : '--'}</td>
                <td>{data.req.method}</td>
                <td>{getProtocol(data.req.url)}</td>
                <td title={getDomain(data.req.url)}>{getDomain(data.req.url)}</td>
                <td title={getPath(data.req.url)}>{getPath(data.req.url)}</td>
                <td><a onClick={() => setDetail(data)}>Detail</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
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
