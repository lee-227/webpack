// es模块会被转换成 commonjs模块
(() => {
  // 根据依赖图构建模块对象，key为模块Id既该模块相对于根目录的相对路径，value为模块源代码
  var modules = {
    './src/title.js': (module, exports, require) => {
      module.exports = {
        age: 18,
      };
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
  require.n = (exports) => {
    return exports.__esModule ? () => exports.default : () => exports;
  };
  const exports = {};
  (() => {
    // 入口文件
    require.r(exports); // 标记改模块是 es 模块
    let temp = require('./src/title.js');
    const default_value = require.n(temp); // 兼容，因为不知道导入的是es模块 还是 commonjs 模块
    console.log(default_value());
    console.log(temp.age);
  })();
})();
