// 函数的返回值回向下传递
let { AsyncSeriesWaterfallHook } = require('tapable');
let queue = new AsyncSeriesWaterfallHook(['name', 'age']);
// console.time('cost');
// queue.tapAsync('1', function (name, age, callback) {
//   setTimeout(function () {
//     console.log(1, name, age);
//     callback(null, 1);
//   }, 1000);
// });
// queue.tapAsync('2', function (data, age, callback) {
//   setTimeout(function () {
//     console.log(2, data, age);
//     callback(null, 2);
//   }, 2000);
// });
// queue.tapAsync('3', function (data, age, callback) {
//   setTimeout(function () {
//     console.log(3, data, age);
//     callback(null, 3);
//   }, 3000);
// });
// queue.callAsync('lee', 10, (err, data) => {
//   console.log(err, data);
//   console.timeEnd('cost');
// });

console.time('cost');
queue.tapPromise('1', function (name) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      console.log(name, 1);
      resolve(1);
    }, 1000);
  });
});
queue.tapPromise('2', function (data) {
  return new Promise(function (resolve) {
    setTimeout(function () {
      console.log(data, 2);
      resolve(2);
    }, 2000);
  });
});
queue.tapPromise('3', function (data) {
  return new Promise(function (resolve) {
    setTimeout(function () {
      console.log(data, 3);
      resolve(3);
    }, 3000);
  });
});
queue.promise('lee').then((data) => {
  console.log('成功: ',data);
  console.timeEnd('cost');
}).catch((err) => {
  console.log('失败: ',err);
  console.timeEnd('cost');
})
