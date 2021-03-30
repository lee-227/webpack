(() => {
  //存放着所有的模块定义，包括懒加载，或者说异步加载过来的模块定义
  var modules = {};
  var cache = {};
  //因为在require的时候，只会读取modules里面的模块定义
  function require(moduleId) {
    if (cache[moduleId]) {
      //先看缓存里有没有已经缓存的模块对象
      return cache[moduleId].exports; //如果有就直接返回
    }
    //module.exports默认值 就是一个空对象
    var module = { exports: {} };
    cache[moduleId] = module;
    //会在模块的代码执行时候给module.exports赋值
    modules[moduleId].call(module.exports, module, module.exports, require);
    return module.exports;
  }
  const installChunks = {
    main: 0,
  };
  require.p = ''; // publicPath 资源访问路径
  require.f = {};
  // 4. 将该代码块所有的 promise存放到promises中，同时加载模块数据
  require.f.j = (chunkId, promises) => {
    let promise = new Promise((resolve, reject) => {
      installChunks[chunkId] = [resolve, reject];
    });
    promises.push(promise);
    var url = require.p + require.u(chunkId);
    require.l(url);
  };
  require.u = (chunkId) => {
    return chunkId + '.lee.js';
  };
  // 5. 通过script标签请求数据
  require.l = (url) => {
    url = 'copy-hello.js'; // 模拟用
    let script = document.createElement('script');
    script.src = url;
    document.head.appendChild(script);
  };
  // 3. 创建代码块的promise
  require.e = (chunkId) => {
    let promises = [];
    require.f.j(chunkId, promises);
    return Promise.all(promises); // 等待该代码块所有 promise 完成在进行下一步
  };
  require.d = (exports, definition) => {
    for (let key in definition) {
      Object.defineProperty(exports, key, {
        enumerable: true,
        get: definition[key],
      });
    }
  };
  require.r = (exports) => {
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
    Object.defineProperty(exports, '__esModule', { value: true });
  };
  const webpackJsonpCallback = ([chunkIds, moreModules]) => {
    // 6. 数据返回后将该代码块的 promise 调用 resolve 完成，同时将各个模块的数据注册到 modules 上
    let resolves = [];
    for (let i = 0; i < chunkIds.length; i++) {
      let chunkData = installChunks[chunkIds[i]];
      installChunks[chunkIds[i]] = 0;
      resolves.push(chunkData[0]);
    }
    for (const moduleId in moreModules) {
      modules[moduleId] = moreModules[moduleId];
    }
    resolves.forEach((resolve) => resolve());
  };
  // 0. 添加 window['webpack5'] 供 JSONP 返回的数据使用
  var chunkLoadingGlobal = (window['webpack5'] = []);
  // 1. 重写 push 方法
  chunkLoadingGlobal.push = webpackJsonpCallback;
  require
    .e('hello') // 2. 异步加载 hello 代码块
    .then(require.bind(require, './src/hello.js')) // 7. 加载完成后再通过注册的模块ID获取模块内容
    .then((res) => {
      console.log(res.default);
    });
})();
