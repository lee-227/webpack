module.exports = class HookCodeFactory {
  // 8. 初始化参数
  setup(hookInstance, options) {
    hookInstance._x = options.taps.map((i) => i.fn);
  }

  init(options) {
    this.options = options;
  }

  deinit() {
    this.options = null;
  }
  // 9. 根据type生成不同的函数
  create(options) {
    this.init(options);
    let fn;
    switch (this.options.type) {
      case 'sync':
        fn = new Function(this.args(), this.header() + this.content()); // 12. this.content() 调用子类的content方法
        break;
      case 'async':
        fn = new Function(
          // 为生成的函数 调价一个回调参数
          this.args({ after: '_callback' }),
          // 函数体中调价回调函数的调用
          this.header() + this.content({ onDone: () => ' _callback();\n' })
        );
        break;
      case 'promise':
        let tapsContent = this.content({ onDone: () => ' _resolve();\n' });
        let content = `return new Promise(function (_resolve, _reject) {
                           ${tapsContent}
                       })`;
        fn = new Function(this.args(), this.header() + content);
        break;
      default:
        break;
    }
    this.deinit();
    return fn;
  }
  // 10. 生成参数
  args(options = {}) {
    let { before, after } = options;
    let allArgs = this.options.args || [];
    if (before) allArgs = [before, ...allArgs];
    if (after) allArgs = [...allArgs, after];
    if (allArgs.length > 0) return allArgs.join(',');
    return '';
  }
  // 11. 生成头部
  header() {
    let code = '';
    // this指向 SyncHook实例
    code += 'var _x = this._x;\n';
    if (this.options.interceptors.length > 0) {
      code += `var _taps = this.taps;\n`;
      code += `var _interceptors = this.interceptors;\n`;
    }
    for (let k = 0; k < this.options.interceptors.length; k++) {
      const interceptor = this.options.interceptors[k];
      if (interceptor.call)
        code += `_interceptors[${k}].call(${this.args()});\n`;
    }
    return code;
  }
  // 14. 遍历每个tap 根据其type 生成函数体
  callTapsSeries() {
    if (this.options.taps.length == 0) return '';
    let code = '';
    for (let i = 0; i < this.options.taps.length; i++) {
      const content = this.callTap(i);
      code += content;
    }
    return code;
  }
  callTapsParallel({ onDone }) {
    let code = `var _counter = ${this.options.taps.length};\n`;
    code += `
               var _done = function () {
                ${onDone()}
               };
           `;
    for (let j = 0; j < this.options.taps.length; j++) {
      const content = this.callTap(j);
      code += content;
    }
    return code;
  }
  callTap(index) {
    let code = '';
    if (this.options.interceptors.length > 0) {
      code += `var _tap${index} = _taps[${index}];`;
      for (let i = 0; i < this.options.interceptors.length; i++) {
        let interceptor = this.options.interceptors[i];
        if (interceptor.tap) {
          code += `_interceptors[${i}].tap(_tap${index});`;
        }
      }
    }
    code += `var _fn${index} = _x[${index}];\n`;
    let tap = this.options.taps[index];
    switch (tap.type) {
      case 'sync':
        code += `_fn${index}(${this.args()});\n`;
        break;
      case 'async':
        code += ` 
            _fn${index}(${this.args({
          after: `function (_err${index}) {
            if (--_counter === 0) _done();
          }`,
        })});`;
        break;
      case 'promise':
        code = `
              var _fn${index} = _x[${index}];
              var _promise${index} = _fn${index}(${this.args()});
              _promise${index}.then(
                  function () {
                    if (--_counter === 0) _done();
                  }
              );
          `;
        break;
      default:
        break;
    }
    return code;
  }
};
