// es模块会被转换成 commonjs模块
(() => {
  // 根据依赖图构建模块对象，key为模块Id既该模块相对于根目录的相对路径，value为模块源代码
  var modules = {
    './src/title.js': (module, exports, require) => {
      require.r(exports); // 如果原来是es模块 会通过r方法将该模块标记为es模块
      require.d(exports, {
        // 该方法将es模块转成 commonjs模块 将 export default的值付给 default属性
        default: () => DEFAULT_EXPORT,
        age: () => age,
      });
      const DEFAULT_EXPORT = 'title_name';
      const age = 'title_age';
    },
  };
  const cache = {}; // 模块缓存
  function require(moduleId) {
    // 自己实现的 require 方法
    if (cache[moduleId]) return cache[moduleId].exports; // 命中缓存直接返回缓存内容
    const module = { exports: {} };
    cache[moduleId] = module;
    modules[moduleId].call(module.exports, module, module.exports, require);
    // 根据模块ID执行对应模块代码
    // 模块内的 this 默认为该模块导出的 exports 对象
    return module.exports;
  }
  require.r = (exports) => {
    Object.defineProperty(exports, '__esModule', { value: true });
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
  };
  require.d = (exports, definition) => {
    for (const key in definition) {
      Object.defineProperty(exports, key, {
        enumerable: true,
        get: definition[key],
      });
    }
  };
  (() => {
    // 入口文件
    let title = require('./src/title.js');
    console.log(title);
    console.log(title.age);
  })();
})();
