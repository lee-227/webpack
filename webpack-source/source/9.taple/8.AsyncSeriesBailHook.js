// 只要有一个返回了不为 undefined 的值就直接结束
let { AsyncSeriesBailHook } = require('tapable');
let queue = new AsyncSeriesBailHook(['name']);
// console.time('cost');
// queue.tapAsync('1', function (name, callback) {
//   setTimeout(function () {
//     console.log(1);
//     callback('wrong');
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

console.time('cost');
queue.tapPromise('1', function (name) {
  return new Promise(function (resolve) {
    setTimeout(function () {
      console.log(1);
      resolve();
    }, 1000);
  });
});
queue.tapPromise('2', function (name, callback) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      console.log(2);
      resolve('成');
    }, 2000);
  });
});
queue.tapPromise('3', function (name, callback) {
  return new Promise(function (resolve) {
    setTimeout(function () {
      console.log(3);
      resolve();
    }, 3000);
  });
});
queue.promise('lee').then(
  (data) => {
    console.log(data);
    console.timeEnd('cost');
  },
  (error) => {
    console.log(error);
    console.timeEnd('cost');
  }
);
