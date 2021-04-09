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
  callTap(index) {
    let code = '';
    code += `var _fn${index} = _x[${index}];\n`;
    let tap = this.options.taps[index];
    switch (tap.type) {
      case 'sync':
        code += `_fn${index}(${this.args()});\n`;
        break;

      default:
        break;
    }
    return code;
  }
};
