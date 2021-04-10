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
    this.interceptors = [];
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
    if (options === 'string') {
      options = { name: options };
    }
    let tapInfo = { ...options, type, fn };
    tapInfo = this._runRegisterInterceptors(tapInfo);
    this._insert(tapInfo);
  }
  _runRegisterInterceptors(tapInfo) {
    for (const interceptor of this.interceptors) {
      if (interceptor.register) {
        let newTapInfo = interceptor.register(tapInfo);
        if (newTapInfo) {
          tapInfo = newTapInfo;
        }
      }
    }
    return tapInfo;
  }
  intercept(interceptor) {
    this.interceptors.push(interceptor);
  }
  _insert(tapInfo) {
    // 4. 每次调用tap时 重新生成 call 方法
    this._resetCompilation();
    let before;
    if (typeof tapInfo.before === 'string') {
      before = new Set([tapInfo.before]);
    } else if (Array.isArray(tapInfo.before)) {
      before = new Set(tapInfo.before);
    }
    // 5. 存储tap
    let stage = 0;
    if (typeof tapInfo.stage === 'number') {
      stage = tapInfo.stage;
    }
    let i = this.taps.length;
    while (i > 0) {
      i--;
      const x = this.taps[i];
      this.taps[i + 1] = x;
      const xStage = x.stage || 0;
      if (before) {
        if (before.has(x.name)) {
          before.delete(x.name);
          continue;
        }
        if (before.size > 0) {
          continue;
        }
      }
      if (xStage > stage) {
        continue;
      }
      i++;
      break;
    }
    this.taps[i] = tapInfo;
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
      interceptors: this.interceptors,
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
