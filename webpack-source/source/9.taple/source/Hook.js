module.exports = class Hook {
  constructor(args) {
    // 初始化参数
    if (!Array.isArray(args)) args = [];
    this.args = args;
    this.taps = [];
    // 惰性函数 当调用call时会生成一个新的函数
    this.call = CALL_DELEGATE;
    this.callAsync = CALL_ASYNC_DELEGATE;
    this.promise = PROMISE_DELEGATE;
  }
  // 2. 调用tap注册事件
  tap(options, fn) {
    this._tap('sync', options, fn);
  }
  // 注册异步钩子
  tapAsync(options, fn) {
    this._tap('async', options, fn);
  }
  tapPromise(options, fn) {
    this._tap('promise', options, fn);
  }
  // 3. 初始化option 跟 tapInfo
  _tap(type, options, fn) {
    if ((options = 'string')) {
      options = { name: options };
    }
    let tapInfo = { ...options, type, fn };
    this._insert(tapInfo);
  }
  _insert(tap) {
    // 4. 每次调用tap时 重新生成 call 方法
    this._resetCompilation();
    // 5. 存储tap
    this.taps.push(tap);
  }
  _resetCompilation() {
    this.call = CALL_DELEGATE;
  }
  compile(options) {
    throw new Error('Abstract: should be overridden');
  }
  // 7. 调用子类实现的compile 生成函数
  _createCall(type) {
    return this.compile({
      taps: this.taps,
      args: this.args,
      type,
    });
  }
};
// 6. 调用call时 通过_createCall 产生新函数 并赋值给call 调用call
const CALL_DELEGATE = function (...args) {
  this.call = this._createCall('sync');
  // 14. 得到生成的函数 执行
  return this.call(...args);
};
const CALL_ASYNC_DELEGATE = function (...args) {
  // 生成异步callAsync
  this.callAsync = this._createCall('async');
  return this.callAsync(...args);
};
const PROMISE_DELEGATE = function (...args) {
  // 生成promise异步
  this.promise = this._createCall('promise');
  return this.promise(...args);
};
