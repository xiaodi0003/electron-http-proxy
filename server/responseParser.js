var zlib = require('zlib');

exports.parse = function(res) {
  const buffer = [];
  res.on('data', function(chunk){
    buffer.push(new Buffer(chunk));
  });

  return new Promise(resolve => {
    res.on('end', function(){
      resolve(unzip(res, buffer));
    });
  });
};

function unzip(res, buffer) {
  const encoding = res.headers["content-encoding"];

  return new Promise(resolve => {
    if(encoding !== undefined && encoding.indexOf("gzip") >= 0){
      zlib.gunzip(Buffer.concat(buffer),function(er, gunzipped){
        resolve(gunzipped.toString());
      });
    } else if(encoding !== undefined && encoding.indexOf("deflate") >= 0){
      zlib.inflate(Buffer.concat(buffer),function(er, inflated){
        resolve(inflated.toString());
      });
    } else {
      resolve(Buffer.concat(buffer).toString());
    }
  });
}
