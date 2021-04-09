const Hook = require('./Hook');
const HookCodeFactory = require('./HookCodeFactory');
class SyncHookCodeFactory extends HookCodeFactory {
  content() {
    // 13. 调用父类callTapsSeries 生成函数体
    return this.callTapsSeries();
  }
}
let factory = new SyncHookCodeFactory();
// 1. 初始化 会调用父类的构造函数
module.exports = class SyncHook extends Hook {
  compile(options) {
    // 7. 调用CodeFactory 生成call方法
    factory.setup(this, options);
    return factory.create(options);
  }
};
