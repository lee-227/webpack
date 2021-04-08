// 如果上一个回调函数的结果不为 undefined,则可以作为下一个回调函数的第一个参数
// 回调函数接受的参数来自于上一个函数的结果
// 当回调函数返回非 undefined 不会停止回调栈的调用，且下一个回调的参数还是当前函数接受的参数
const { SyncWaterfallHook } = require('tapable');
const hook = new SyncWaterfallHook(['name']);
hook.tap('1', (name) => {
  console.log(1, name);
});
hook.tap('2', (name) => {
  console.log(2, name);
  return 2;
});
hook.tap('3', (name) => {
  console.log(3, name);
  return 3;
});
hook.call('lee', 24);
