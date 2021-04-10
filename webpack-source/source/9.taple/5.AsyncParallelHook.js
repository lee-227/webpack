// 异步并行执行钩子
let { AsyncParallelHook } = require('./source/index');
let queue = new AsyncParallelHook(['name']);

// tap 同步注册
// console.time('cost');
// queue.tap('1', function (name) {
//   console.log(1);
// });
// queue.tap('2', function (name) {
//   console.log(2);
// });
// queue.tap('3', function (name) {
//   console.log(3);
// });
// queue.callAsync('lee', (err) => {
//   console.log(err);
//   console.timeEnd('cost');
// });

// tapAsync 异步注册 全部任务完成后执行最终的回调
// console.time('cost');
// queue.tapAsync('1', function (name, callback) {
//   setTimeout(function () {
//     console.log(1);
//     callback();
//   }, 1000);
// });
// queue.tapAsync('2', function (name, callback) {
//   setTimeout(function () {
//     console.log(2);
//     callback();
//   }, 2000);
// });
// queue.tapAsync('3', function (name, callback) {
//   setTimeout(function () {
//     console.log(3);
//     callback();
//   }, 3000);
// });
// queue.callAsync('lee', (err) => {
//   console.log(err);
//   console.timeEnd('cost');
// });

// tapPromise 注册钩子 全部完成后执行才算成功
console.time('cost');
queue.tapPromise('1', function (name) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      console.log(1);
      resolve();
    }, 1000);
  });
});
queue.tapPromise('2', function (name) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      console.log(2);
      resolve();
    }, 2000);
  });
});
queue.tapPromise('3', function (name) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      console.log(3);
      resolve();
    }, 3000);
  });
});
queue.promise('lee').then(() => {
  console.timeEnd('cost');
});
