// 不用express-http-proxy是因为它无法创建动态代理，只能预先指定代理的target
const httpProxy = require('http-proxy');
const bodyParser = require('body-parser');
// 用express是为了实现bodyParser
const express = require('express');
const {serverMessage} = require('./messageBus.js');
const responseParser = require('./responseParser.js');
const doProxy = require('./doProxy.js');

function getReq(req) {
  const id = `${Date.now()}-${Math.random()}`;
  serverMessage('req', {
    id,
    req: {
      url: req.url,
      httpVersion: req.httpVersion,
      method: req.method,
      headers: req.headers,
      body: req.body
    }
  });
  req.id = id;
}

function getRes(proxyRes, req) {
  responseParser.parse(proxyRes).then(body => {
    sendRes(req, proxyRes, body);
  });
}

function sendRes(req, res, body, err) {
  serverMessage('res', {
    id: req.id,
    res: {
      httpVersion: res.httpVersion,
      headers: res.headers,
      statusCode: res.statusCode,
      statusMessage: res.statusMessage,
      body,
      err
    }
  });
}

// todo 这里把body填上
function sendExpressRes(req, res, body, err) {
  const [httpVersion, statusCode, statusMessage] = res._header.split('\n')[0].split(' ');
  serverMessage('res', {
    id: req.id,
    res: {
      httpVersion: httpVersion.replace(/.*\//, ''),
      headers: res._header.split('\n').slice(1).map(h => h.split(': ')).filter(h => h.length === 2).reduce((l, n) => ({...l, [n[0]]: n[1]}), {}),
      statusCode,
      statusMessage,
      body,
      err
    }
  });
}

const proxy = httpProxy.createProxyServer({});

proxy.on('error', (err, req, res) => {
  res.statusCode = err.code;
  sendRes(req, res, '', JSON.stringify(err, null, 2));
  res.end();
});

proxy.on('proxyRes', function(proxyRes, req, res) {
  getRes(proxyRes, req);
})

const app = express();

// parse various different custom JSON types as JSON
app.use(bodyParser.json({ type: req => req.headers['content-type'].includes('json') }));
 
// parse some custom thing into a Buffer
app.use(bodyParser.raw({ type: 'application/vnd.custom-type' }));

app.use(bodyParser.urlencoded({ type: '*/x-www-form-urlencoded', extended: false }));

// parse an HTML body into a string
app.use(bodyParser.text({ type: () => true }));

app.use(function (req, res, next) { /* 表示匹配任何路由 */
  getReq(req);
  res.on('close', () => {
    if (req.fileProtocol) {
      sendExpressRes(req, res);
    }
  });
  console.log(req.url);
  // proxy.web(req, res, { target: req.url.replace(/(https?:\/\/[^/]*).*/, '$1') });
  doProxy.proxy(req, res, proxy);
});

exports.start = port => {
  app.listen(port, () => console.log(`listening on port ${port}!`));
};

process.on('uncaughtException', (error) => {
  console.log('error:', error);
});

process.on('unhandledRejection', (error) => {
  console.log('error:', error);
}, true);

// const http = require('http');
// const httpProxy = require('http-proxy');
// var proxy = httpProxy.createProxyServer({});
// var server = http.createServer(function(req, res) {
//   console.log(req.url);
//   res.end('1');
//   proxy.web(req, res, { target: req.url.replace(/(https?:\/\/[^/]*).*/, '$1') });
// });
// server.listen(5050);