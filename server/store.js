// 参考 cnblogs.com/xusx2014/p/11967789.html
const Store = require('electron-store');
const store = new Store();

exports.set = store.set.bind(store);
exports.get = store.get.bind(store);
