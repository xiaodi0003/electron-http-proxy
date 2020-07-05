import { Modal, Tabs } from 'antd';
import React from 'react';
import ReactJson from 'react-json-view';
import { HttpPackage } from '@/models/connect';
import './index.less';

const TabPane = Tabs.TabPane;

function getBodyStr(req: any) {
  if (!req || !req.body) {
    return '';
  }
  return req.body.split ? req.body : JSON.stringify(req.body, null, 2);
}

function isJson(req: any) {
  return req?.headers && req.headers['content-type'] && req.headers['content-type'].includes('json');
}

const HttpPackageDetail: React.FC<{detail: HttpPackage | null; onOk: () => void; getPath: any}> = ({
  detail,
  getPath,
  onOk
}) => {
  function getRequest() {
    return (
      <div className='httprequest'>
        {`${detail?.req.method} ${getPath(detail?.req.url)} HTTP/${detail?.req.httpVersion}`}
      </div>
    );
  }

  function getResponse() {
    return (
      <div className='httprequest'>
        {`HTTP/${detail?.res.httpVersion} ${detail?.res.statusCode} ${detail?.res.statusMessage}`}
      </div>
    );
  }

  function getHeader(req: any) {
    return (
      <div className='httpheader'>
        {Object.entries(req.headers || {}).map(([key, value]) => (
          <div key={key}>
            <span key={`${key}`}>{key}:</span>
            <span key={`${key}-${value}`}>{value}</span>
          </div>
        ))}
      </div>
    );
  }

  function getReqBody(str: string) {
    return <pre className='httpbody'>{str}</pre>;
  }

  function getBodyJson(jsonData) {
    let src = '';
    try {
      src = jsonData.split ? jsonData : JSON.parse(jsonData)
    } catch (error) {
      console.error(error);
    }
    return (
      <div className='httpbody'>
        <ReactJson src={src} />
      </div>
    );
  }

  function getResErr() {
    return <pre className='httpbody'>{detail?.res.err}</pre>;
  }

  function isGet() {
    return detail?.req.method.toLowerCase() === 'get';
  }

  function renderReq(req) {
    return (
      <>
        <div key='1'>
          请求
        </div>
        <div key='2'>
          <Tabs defaultActiveKey='request'>
            <TabPane tab='Request' key='request'>{getRequest()}</TabPane>
            <TabPane tab='Header' key='header'>{getHeader(req)}</TabPane>
            {isGet() || <TabPane tab='Body' key='body'>{getReqBody(getBodyStr(req))}</TabPane>}
            {isJson(req) && <TabPane tab='JSON Body' key='json'>{getBodyJson(req.body)}</TabPane>}
          </Tabs>
        </div>
      </>
    );
  }

  function renderRes(res) {
    return (
      <>
        <div key='3'>
          响应
        </div>
        <div key='4'>
          <Tabs defaultActiveKey='response'>
            <TabPane tab='Response' key='response'>{getResponse()}</TabPane>
            <TabPane tab='Header' key='header'>{getHeader(res)}</TabPane>
            {res.body && <TabPane tab='Body' key='body'>{getReqBody(getBodyStr(res))}</TabPane>}
            {isJson(res) && !res.err && <TabPane tab='JSON Body' key='json'>{getBodyJson(res.body)}</TabPane>}
            {res.err && <TabPane tab='Err' key='err'>{getResErr()}</TabPane>}
          </Tabs>
        </div>
      </>
    );
  }

  return detail && (
    <Modal
      className='httpdetail'
      title={<span className='ellipsis' title={detail.req.url}>{detail.req.url}</span>}
      visible
      onOk={onOk}
      onCancel={onOk}
    >
      {detail.req && renderReq(detail.req)}
      {detail.res && renderRes(detail.res)}
    </Modal>
  );
};

export default HttpPackageDetail;
