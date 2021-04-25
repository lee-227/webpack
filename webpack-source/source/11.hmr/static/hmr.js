(() => {
  var cache = {};
  var currentHash;
  var lastHash;
  let hotUpdate = {};

  let hotCheck = () => {
    //6.它通过调用 JsonpMainTemplate.runtime的hotDownloadManifest方法，向 server 端发送 Ajax 请求，服务端返回一个 Manifest文件，该 Manifest 包含了所有要更新的模块的 hash 值和chunk名
    hotDownloadManifest()
      .then((update) => {
        update.c.forEach((chunkID) => {
          //7.调用JsonpMainTemplate.runtime的hotDownloadUpdateChunk方法通过JSONP请求获取到最新的模块代码
          hotDownloadUpdateChunk(chunkID);
        });
        lastHash = currentHash;
      })
      .catch((err) => {
        window.location.reload();
      });
  };
  let hotDownloadManifest = () => {
    return new Promise((resolve, reject) => {
      let xhr = new XMLHttpRequest();
      let hotUpdatePath = `main.${lastHash}.hot-update.json`;
      xhr.open('get', hotUpdatePath);
      xhr.onload = () => {
        let hotUpdate = JSON.parse(xhr.responseText);
        resolve(hotUpdate);
      };
      xhr.onerror = (error) => {
        reject(error);
      };
      xhr.send();
    });
  };
  let hotDownloadUpdateChunk = (chunkID) => {
    let script = document.createElement('script');
    script.src = `${chunkID}.${lastHash}.hot-update.js`;
    document.head.appendChild(script);
  };

  //8.补丁JS取回来后会调用JsonpMainTemplate.runtime.js的webpackHotUpdate方法，里面会调用hotAddUpdateChunk方法,用新的模块替换掉旧的模块
  self['webpackHotUpdate'] = (chunkId, moreModules) => {
    //9.然后会调用HotModuleReplacement.runtime.js的hotAddUpdateChunk方法动态更新模块代 码
    hotAddUpdateChunk(chunkId, moreModules);
  };

  function hotAddUpdateChunk(chunkId, moreModules) {
    for (var moduleId in moreModules) {
      hotUpdate[moduleId] = modules[moduleId] = moreModules[moduleId];
    }
    //10.然后调用hotApply方法进行热更新
    hotApply();
  }
  function hotApply() {
    for (let moduleId in hotUpdate) {
      let oldModule = cache[moduleId];
      delete cache[moduleId];
      oldModule.parents &&
        oldModule.parents.forEach((parentModule) => {
          parentModule.hot._acceptedDependencies[moduleId] &&
            parentModule.hot._acceptedDependencies[moduleId]();
        });
    }
  }
  var modules = {
    './src/index.js': (module, exports, require) => {
      let render = () => {
        let title = require('./src/title.js');
        root.innerText = title;
      };
      render();
      if (module.hot) {
        module.hot.accept(['./src/title.js'], render);
      }
    },
    './src/title.js': (module) => {
      module.exports = 'title3';
    },
    './webpack/hot/emitter.js': (module) => {
      class EventEmitter {
        constructor() {
          this.events = {};
        }
        on(eventName, fn) {
          this.events[eventName] = fn;
        }
        emit(eventName, ...args) {
          this.events[eventName](...args);
        }
      }
      module.exports = new EventEmitter();
    },
  };

  function hotCreateModule() {
    var hot = {
      _acceptedDependencies: {},
      accept: function (deps, callback) {
        for (var i = 0; i < deps.length; i++)
          hot._acceptedDependencies[deps[i]] = callback;
      },
      check: hotCheck,
    };
    return hot;
  }
  function hotCreateRequire(parentModuleId) {
    var parentModule = cache[parentModuleId];
    if (!parentModule) return require;
    var fn = function (childModuleId) {
      parentModule.children.push(childModuleId);
      require(childModuleId);
      let childModule = cache[childModuleId];
      childModule.parents.push(parentModule);
      return childModule.exports;
    };
    return fn;
  }
  function require(moduleId) {
    if (cache[moduleId]) {
      return cache[moduleId].exports;
    }
    var module = (cache[moduleId] = {
      exports: {},
      hot: hotCreateModule(moduleId),
      parents: [],
      children: [],
    });
    modules[moduleId](module, module.exports, hotCreateRequire(moduleId));
    return module.exports;
  }
  (() => {
    var hotEmitter = require('./webpack/hot/emitter.js');
    var socket = io();
    //1.客户端会监听到此`hash`消息,会保存此hash值
    socket.on('hash', (hash) => {
      currentHash = hash;
    });
    socket.on('ok', () => {
      console.log('ok');
      //2. 客户端收到ok的消息后会执行reloadApp方法进行更新
      reloadApp();
    });
    function reloadApp() {
      //3.在reloadApp中会进行判断，是否支持热更新，如果支持的话发射webpackHotUpdate事件,如果不支持则直接刷新浏览器
      hotEmitter.emit('webpackHotUpdate', currentHash);
    }
  })();
  (() => {
    var hotEmitter = require('./webpack/hot/emitter.js');
    //4.监听webpackHotUpdate事件,然后执行hotCheck()方法进行检查
    hotEmitter.on('webpackHotUpdate', (currentHash) => {
      if (!lastHash) {
        lastHash = currentHash;
        console.log('lastHash=', lastHash, 'currentHash=', currentHash);
        return;
      }
      console.log('lastHash=', lastHash, 'currentHash=', currentHash);
      console.log('webpackHotUpdate hotCheck');
      //在check方法里会调用module.hot.check方法
      //module.hot.check(); hotCheck();
    });
  })();
  return hotCreateRequire('./src/index.js')('./src/index.js');
})();
