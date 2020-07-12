const {serverMessage} = require('./messageBus.js');
const doProxy = require('./doProxy.js');

function getReq(req) {
  const id = `${Date.now()}-${Math.random()}`;
  serverMessage('req', {
    id,
    req: {
      url: req.url,
      httpVersion: req._req.httpVersion,
      method: req._req.method,
      headers: req._req.headers,
      body: req.requestData.toString()
    }
  });
  req._req.id = id;
}

function sendRes(req, res) {
  serverMessage('res', {
    id: req._req.id,
    res: {
      httpVersion: res._res.httpVersion,
      headers: res._res.headers,
      statusCode: res._res.statusCode,
      statusMessage: res._res.statusMessage,
      body: res.response.body.toString()
    }
  });
}

function sendFileRes(req, res) {
  serverMessage('res', {
    id: req._req.id,
    res: {
      httpVersion: req._req.httpVersion,
      headers: res.header,
      statusCode: res.statusCode,
      statusMessage: res.statusMessage || '',
      body: res.body.toString()
    }
  });
}

module.exports = {
  summary: 'page proxy config',
  *beforeSendRequest(requestDetail) {
    getReq(requestDetail);
    const result = yield doProxy.proxy(requestDetail);
    if (result.response) {
      sendFileRes(requestDetail, result.response);
    }
    return result;
  },
  *beforeSendResponse(requestDetail, responseDetail) {
    sendRes(requestDetail, responseDetail);
    const newResponse = responseDetail.response;
    // newResponse.body += '- AnyProxy Hacked!';
    // console.log('newResponse.body', newResponse.body);
    return new Promise((resolve, reject) => {
      setTimeout(() => resolve({ response: newResponse }), 1);
    });
  },
  *beforeDealHttpsRequest(requestDetail) { return true; },
  // 请求出错的事件
  *onError(requestDetail, error) { return Promise.resolve(true); },
  // https连接服务器出错
  *onConnectError(requestDetail, error) { return Promise.resolve(true); }
};
