// 当回调函数返回非 undefined 值的时候会停止调用后续的回调
const { SyncBailHook } = require('tapable');
const hook = new SyncBailHook(['name', 'age']);
hook.tap('1', (name, age) => {
  console.log(1, name, age);
  return 1;
});
hook.tap('2', (name, age) => {
  console.log(2, name, age);
});
hook.tap('3', (name, age) => {
  console.log(3, name, age);
});
hook.call('lee', 24);
