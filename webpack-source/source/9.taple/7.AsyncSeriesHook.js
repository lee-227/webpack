// 异步串行钩子
// 任务一个一个执行,执行完上一个执行下一个
let { AsyncSeriesHook } = require('tapable');
let queue = new AsyncSeriesHook(['name']);
console.time('cost');
queue.tapAsync('1', function (name, callback) {
  setTimeout(function () {
    console.log(1);
    callback();
  }, 1000);
});
queue.tapAsync('2', function (name, callback) {
  setTimeout(function () {
    console.log(2);
    callback();
  }, 2000);
});
queue.tapAsync('3', function (name, callback) {
  setTimeout(function () {
    console.log(3);
    callback();
  }, 3000);
});
queue.callAsync('lee', (err) => {
  console.log(err);
  console.timeEnd('cost');
});

// console.time('cost');
// queue.tapPromise('1', function (name) {
//   return new Promise(function (resolve) {
//     setTimeout(function () {
//       console.log(1, name);
//       resolve();
//     }, 1000);
//   });
// });
// queue.tapPromise('2', function (name) {
//   return new Promise(function (resolve) {
//     setTimeout(function () {
//       console.log(2, name);
//       resolve();
//     }, 2000);
//   });
// });
// queue.tapPromise('3', function (name) {
//   return new Promise(function (resolve) {
//     setTimeout(function () {
//       console.log(3, name);
//       resolve();
//     }, 3000);
//   });
// });
// queue.promise('lee').then((data) => {
//   console.log(data);
//   console.timeEnd('cost');
// });
