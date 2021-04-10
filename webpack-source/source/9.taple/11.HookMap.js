let { SyncHook, HookMap } = require('tapable');
const keyedHookMap = new HookMap(() => new SyncHook(['name']));
keyedHookMap.for('key1').tap('plugin1', (name) => {
  console.log(1, name);
});
keyedHookMap.for('key1').tap('plugin2', (name) => {
  console.log(2, name);
});
const hook1 = keyedHookMap.get('key1');
hook1.call('lee');
