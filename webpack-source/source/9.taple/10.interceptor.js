const { SyncHook } = require('./source/index');
const syncHook = new SyncHook(['name', 'age']);
syncHook.intercept({
  register(tap) {
    console.log('开始注册1', tap.name);
    return tap;
  },
  tap(tap) {
    console.log(tap.name + '开始执行1');
  },
  call(name, age) {
    console.log('开始call1', name, age);
  },
});
syncHook.intercept({
  register(tap) {
    console.log('开始注册2', tap.name);
    return tap;
  },
  tap(tap) {
    console.log(tap.name + '开始执行2');
  },
  call(name, age) {
    console.log('开始call2', name, age);
  },
});
syncHook.tap({ name: 'lee' }, (name, age) => {
  console.log('lee', name, age);
});
syncHook.tap({ name: 'lee2' }, (name, age) => {
  console.log('lee2', name, age);
});
syncHook.call('lee', '24');

/**
开始注册1 lee
开始注册2 lee
开始注册1 lee2
开始注册2 lee2
开始call1 lee 24
开始call2 lee 24
lee开始执行1
lee开始执行2
lee lee 24
lee2开始执行1
lee2开始执行2
lee2 lee 24
 */
