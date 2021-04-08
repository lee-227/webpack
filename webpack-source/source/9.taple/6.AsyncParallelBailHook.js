// 带保险的异步并行执行钩子
// 有一个任务返回值不为空就直接结束
let { AsyncParallelBailHook } = require('tapable');
let queue = new AsyncParallelBailHook(['name']);
// console.time('cost');
// queue.tapAsync('1', function (name, callback) {
//   console.log(1);
//   callback('Wrong');
// });
// queue.tapAsync('2', function (name, callback) {
//   console.log(2);
//   callback();
// });
// queue.tapAsync('3', function (name, callback) {
//   console.log(3);
//   callback();
// });
// queue.callAsync('lee', (err) => {
//   console.log(err);
//   console.timeEnd('cost');
// });

// tapPromise 只要有一个任务有 resolve 或者 reject 值，不管成功失败都结束
console.time('cost');
queue.tapPromise('1', function (name) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      console.log(1);
      resolve(1);
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

queue.promise('lee').then(
  (result) => {
    console.log('成功', result);
    console.timeEnd('cost');
  },
  (err) => {
    console.error('失败', err);
    console.timeEnd('cost');
  }
);
