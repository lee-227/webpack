let Hook = require('./Hook');
const HookCodeFactory = require('./HookCodeFactory');
class AsyncParallelHookCodeFactory extends HookCodeFactory {
  content({ onDone }) {
    return this.callTapsParallel({ onDone });
  }
}
let factory = new AsyncParallelHookCodeFactory();
class AsyncParallelHook extends Hook {
  compile(options) {
    factory.setup(this, options);
    return factory.create(options);
  }
}
module.exports = AsyncParallelHook;
