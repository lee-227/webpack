(() => {
  // 根据依赖图构建模块对象，key为模块Id既该模块相对于根目录的相对路径，value为模块源代码
  var modules = {
    './src/title.js': (module, exports, require) => {
      module.exports = 'title';
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
  (() => {
    // 入口文件
    let title = require('./src/title.js');
    console.log(title);
  })();
})();
