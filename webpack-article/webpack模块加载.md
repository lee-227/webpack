# Webpack 是如何实现模块同步加载以及异步加载的 ?

## 同步加载

- 在学习异步加载之前, 我们由简入繁, 先看下 webpack 是如何实现的同步加载

- webpack 作为一款 **模块化打包工具** ,兼容了多种的模块化规范

- 这里我们以经常使用的 commonJs , ES Module 来学习下 webpack 是如何处理这两种规范以实现模块的同步加载的

### 1. commonJs - load - commonJs

- 导出跟导入都采用 commonJs 规范时

```js
// index.js
let title = require('./title.js'); // 采用 commonJs 导入 title.js 文件
console.log(title);

// title.js
module.exports = 'title'; // 采用 commonJs 导出 默认变量 'title'
```

- webpack 打包后结果 (非打包后源代码, 为了方便阅读做了简化, 文章最后会放置所有的源代码)

```js
(() => {

  // 7. 在 webpack 打包阶段会根据依赖图构建出这个模块对象
  // 在这个对象中保存着代码中导入的全部模块的内容
  // key 为模块Id 既该模块相对于根目录的相对路径
  // value 为模块源代码 
  var modules = {
    // 8. 执行对应的模块代码
    './src/title.js': (module, exports, require) => {
      // 我们在 title.js 书写的源代码
      // module, exports, require 参数都是在 __webpack_require__ 方法中传入
      // 这也是我们可以直接使用 require 方法, module 对象的原因
      module.exports = 'title'; 
    },
  };

  const cache = {}; // 模块缓存

  // 3. webpack 自己实现的 __webpack_require__ 方法
  function __webpack_require__(moduleId) {
    if (cache[moduleId]) return cache[moduleId].exports; // 命中缓存直接返回缓存内容
    const module = { exports: {} }; // 3. 构建 module 对象
    cache[moduleId] = module; // 4. 缓存模块
    // 5. 根据模块ID执行对应模块代码
    // 6. 通过 call 方法可以看出 模块内的 this 默认为该模块导出的 exports 对象
    modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
    // 9. 最终返回 module 对象的 exports 属性
    return module.exports;
  }

  (() => {
    // 1. 入口文件 对于 commonJs 规范的导入 原封未动 跟 index.js 保持一致
    // 2. webpack 会将 require 替换为自己实现 __webpack_require__ 方法
    let title = __webpack_require__('./src/title.js'); 
    console.log(title);
  })();

})();
```

### 2. commonJs - load - ES

- commonJs 模块 导入 ES Module

```js
// index.js
let title = require('./title');
console.log(title);
console.log(title.age);


// title.js
export default 'title_name';
export const age = 'title_age';
```

- webpack 打包结果
- 前置知识: [Symbol.toStringTag](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Symbol/toStringTag)

```js
(() => {
  var modules = {
    './src/title.js': (module, exports, require) => {
      // 这里我们发现打包后的模块代码跟源代码不一致了 
      // 此时的 es 模块会被转换成 commonjs 模块
      require.r(exports); // 如果原来是 es 模块 会通过r方法将该模块标记为 es 模块
      require.d(exports, {
        // 该方法将 es 模块转成 commonjs 模块
        // 就是将 export default 的默认导出值赋值给 default 属性
        default: () => DEFAULT_EXPORT,
        age: () => age,
      });
      const DEFAULT_EXPORT = 'title_name';
      const age = 'title_age';
    },
  };

  const cache = {};

  // 代码注释见上文
  function __webpack_require__(moduleId) {
    if (cache[moduleId]) return cache[moduleId].exports;
    const module = { exports: {} };
    cache[moduleId] = module;
    modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
    return module.exports;
  }
  __webpack_require__.r = (exports) => {
    // 通过添加 __esModule 属性将其标记为 ES 模块
    Object.defineProperty(exports, '__esModule', { value: true });
    // 添加 Symbol.toStringTag 属性后,调用 toString() 方法时会返回 Symbol.toStringTag 的值
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
  };
  __webpack_require__.d = (exports, definition) => {
    for (const key in definition) {
      Object.defineProperty(exports, key, {
        enumerable: true,
        get: definition[key],
      });
    }
  };

  (() => {
    // 入口文件
    // commonJs 规范的入口文件 打包后代码跟源代码 保持一致 
    let title = __webpack_require__('./src/title.js');
    console.log(title); // title 的值并不是 title_name 他的 default 属性值才是
    console.log(title.age);
    // commonJs 加载 es 模块时 需要通过 default 属性取到 es 模块的默认导出
  })();

})();
```

- 结论
  
  - webpack 会将 es 模块转成 commonjs 模块
  
  - 并将转换后的模块添加标记变量, 标记他之前为 es 模块
  
  - es 模块的默认导出 会被赋值给 module.exports 对象的 default 属性
  
  - **所以 commonJs 加载 es 模块时 需要通过 default 属性取到 es 模块的默认导出**

### 3. ES - load - ES

- es 模块 加载 es 模块

```js
// index.js
import title, { age } from './title';
console.log(title); // 默认导出
console.log(age);

// title.js
export default 'title_name';
export const age = 'title_age';
```

- webpack 打包结果

```js
(() => {
  var modules = {
    './src/title.js': (module, exports, require) => {
      require.r(exports);
      require.d(exports, {
        default: () => DEFAULT_EXPORT,
        age: () => age,
      });
      const DEFAULT_EXPORT = 'title_name';
      const age = 'title_age';
    },
  };

  const cache = {};

  function __webpack_require__(moduleId) {
    if (cache[moduleId]) return cache[moduleId].exports;
    const module = { exports: {} };
    cache[moduleId] = module;
    modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
    return module.exports;
  }
  __webpack_require__.r = (exports) => {
    Object.defineProperty(exports, '__esModule', { value: true });
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
  };
  __webpack_require__.d = (exports, definition) => {
    for (const key in definition) {
      Object.defineProperty(exports, key, {
        enumerable: true,
        get: definition[key],
      });
    }
  };

  const exports = {};
  (() => {
    // 这里发现入口模块的代码跟我们写的源代码不一样了
    // 此时 es 模块也会被转换成为 commonJs 模块
    __webpack_require__.r(exports); // 首先标记该模块是 es 模块
    let temp = __webpack_require__('./src/title.js');
    console.log(temp.default); // 将 es 模块的默认导出变量 更改为 default 属性输出
    console.log(temp.age); // 其余变量保持不变
  })();
})();
```

- 结论
  
  - 此时打包的后的结果与上文 commonJs 加载 es 时绝大部分都是一样的, 不同点在于对入口模块的处理
  
  - 此时入口模块也为 es 所以 webpack 也会对该模块进行 commonJs 的转换
  
  - 对于 es 的默认输出 转换为 default 属性的输出

### 4. ES - load - commonJs

- ES 模块 加载 commonJs 模块

```js
// index.js
import title, { age } from './title';
console.log(title);
console.log(age);

// title.js
module.exports = {
  age: 18,
};
```

- webpack 打包结果

```js
(() => {
  var modules = {
    './src/title.js': (module, exports, require) => {
      // commonjs 模块不需要处理 保持源代码状
      module.exports = {
        age: 18,
      };
    },
  };

  const cache = {};

  function __webpack_require__(moduleId) {
    if (cache[moduleId]) return cache[moduleId].exports; 
    const module = { exports: {} };
    cache[moduleId] = module;
    modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
    return module.exports;
  }
  __webpack_require__.r = (exports) => {
    Object.defineProperty(exports, '__esModule', { value: true });
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
  };
  __webpack_require__.d = (exports, definition) => {
    for (const key in definition) {
      Object.defineProperty(exports, key, {
        enumerable: true,
        get: definition[key],
      });
    }
  };
  __webpack_require__.n = (exports) => {
    // 通过之前的标记属性 __esModule 判断导入模块类型
    // es 模块 则取其 default 属性 作为默认导出
    // commonJs 模块 取 exports 对象作为默认导出
    return exports.__esModule ? () => exports.default : () => exports;
  };

  const exports = {};
  (() => {
    // 此时 ES 模块代码会被转换 且不同于 es - load - es 时
    __webpack_require__.r(exports); // 标记该模块是 es 模块
    let temp = __webpack_require__('./src/title.js');
    // 调用 n 方法获取默认导出变量兼容，因为不知道导入的是 es 模块 还是 commonjs 模块
    const default_value = __webpack_require__.n(temp); 
    console.log(default_value());
    console.log(temp.age);
  })();
})();
```

- 结论
  
  - 当 webpack 存在 es 加载 commonJs 时, 会导致 webpack 无法识别 导入的模块是何种模块规范, 可能是 es 模块, 也可能是 commonjs 模块
  
  - 此时 webpack 会调用 n 方法, 通过 __esModule 变量判断模块类型, 然后对应着进行取值操作

### 结论

- 通过上文的介绍, 大家已经学到了 webpack 是如何处理 commonJs 模块规范 以及 ES Module   的了, 对于 commonJs webpack 是不做任何特殊处理的, 但是对于 ES Module webpack 会进行代码转译, 将其转换成为 commonJs 模块统一进行处理

- 上文介绍中出现了 ES Module 加载 commonJs , commonJs 加载 ES Module, 在真实开发环境中并**不推荐大家混用两种模块化规范**, **统一使用其中的某一种**才更符合开发标准, 尽管 webpack 允许你混用

## 异步加载

- 请先确保了解了同步加载之后, 再来看 webpack 异步加载的实现

- 它的异步加载也只是在同步加载的基础上添加了一些异步模块的拉取逻辑代码

- 源代码

```js
// index.js
// webpackChunkName 打包后生成的 chunk 名称
import(/* webpackChunkName: "hello" */ './hello').then((result) => {
  console.log(result.default);
});

// hello.js
export default 'hello';
```

- webpack 打包后结果

```js
// main.js
(() => {
  var modules = {};
  var cache = {};
  function require(moduleId) {
    if (cache[moduleId]) {
      return cache[moduleId].exports;
    }
    var module = { exports: {} };
    cache[moduleId] = module;
    modules[moduleId].call(module.exports, module, module.exports, require);
    return module.exports;
  }
  // 加载的所有 chunk, 0 代表加载完成
  const installChunks = {
    main: 0,
  };
  require.p = ''; // publicPath 资源访问路径
  require.f = {};
  // 4. 将该代码块所有的 promise 存放到 promises 中，同时加载模块数据
  require.f.j = (chunkId, promises) => {
    let promise = new Promise((resolve, reject) => {
      // 加载中的 chunk 
      // 值是该 chunk 对应的 promise 的 resolve 跟 reject 方法
      installChunks[chunkId] = [resolve, reject];
    });
    promises.push(promise);

    // 根据 chunkId 拼接 该 chunk 文件对应的 URL 
    var url = require.p + require.u(chunkId);
    require.l(url);
  };
  require.u = (chunkId) => {
    return chunkId + '.js';
  };
  // 5. 通过 script 标签请求数据
  require.l = (url) => {
    let script = document.createElement('script');
    script.src = url;
    document.head.appendChild(script);
    // 此时便会发送请求, 浏览器获取到 chunk 文件后执行对应的代码
    // 见下方 JS 代码快 序号6
  };
  // 3. 创建代码块的 promise
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
    // 7. 数据返回后将该代码块的 promise 调用 resolve 完成，同时将各个模块的数据注册到 modules 上
    let resolves = [];
    for (let i = 0; i < chunkIds.length; i++) {
      let chunkData = installChunks[chunkIds[i]];
      installChunks[chunkIds[i]] = 0; // 该 chunk 加载完成 标记为 0
      resolves.push(chunkData[0]); // 将该 chunk 对应的 promise 的 resolve 存储到 resolves
    }
    for (const moduleId in moreModules) {
      // 将该 chunk 对应的所有 module 注册到 modules 上
      modules[moduleId] = moreModules[moduleId];
    }
    // 执行所有的 resolve 方法 完成对应的 chunk promise
    resolves.forEach((resolve) => resolve());
  };

  // 0. 添加 window['webpack5'] 供 JSONP 返回的数据使用
  // 在 hello.js chunk 文件中会用到
  var chunkLoadingGlobal = (window['webpack5'] = []);
  // 1. 重写 window['webpack5'] push 方法
  chunkLoadingGlobal.push = webpackJsonpCallback;

  require
    // 2. 先异步加载 hello.js 代码块 传入 chunkId
    .e('hello')
    // 8. 加载完成后再通过注册的模块ID获取模块内容, 后续等同于之前的同步加载了
    .then(require.bind(require, './src/hello.js'))
    .then((res) => {
      console.log(res.default);
    });
})();
```

```js
// 异步加载 会生成单独的 chunk 文件
// hello.js
// 6.执行window["webpack5"]上的push方法,传递参数[chunkIds,moreModules]
// 该文件存储这对应的 chunkId 以及该 chunk 包含的所有 module
(window['webpack5'] = window['webpack5'] || []).push([
  ['hello'],
  {
    './src/hello.js': (module, exports, require) => {
      require.r(exports);
      require.d(exports, {
        default: () => __WEBPACK_DEFAULT_EXPORT__,
      });
      const __WEBPACK_DEFAULT_EXPORT__ = 'hello ';
    },
  },
]);
```

- 就不总结了~ 大家按序号读下来应该能看明白

- 简单来讲就是 通过 JsonP 的方式, 先加载异步模块代码

- 加载完成后执行预设好的 webpack 方法将异步内容注册到 modules 上,并标记加载完成

- 加载完成后再按照同步加载的逻辑获取模块内容

## webpack 打包结果源代码 (下方内容可忽略~)
- 版本 "webpack": "^5.28.0"
- 源代码与 webpack 版本强绑定, 可自己亲自尝试学习最新版本打包结果
### 1. commonJs - load - commonJs
```js
/******/ (() => {
  // webpackBootstrap
  /******/ var __webpack_modules__ = {
    /***/ './src/title.js':
      /*!**********************!*\
  !*** ./src/title.js ***!
  \**********************/
      /***/ (module) => {
        module.exports = 'title';

        /***/
      },

    /******/
  }; // The module cache
  /************************************************************************/
  /******/ /******/ var __webpack_module_cache__ = {}; // The require function
  /******/
  /******/ /******/ function __webpack_require__(moduleId) {
    /******/ // Check if module is in cache
    /******/ var cachedModule = __webpack_module_cache__[moduleId];
    /******/ if (cachedModule !== undefined) {
      /******/ return cachedModule.exports;
      /******/
    } // Create a new module (and put it into the cache)
    /******/ /******/ var module = (__webpack_module_cache__[moduleId] = {
      /******/ // no module.id needed
      /******/ // no module.loaded needed
      /******/ exports: {},
      /******/
    }); // Execute the module function
    /******/
    /******/ /******/ __webpack_modules__[moduleId](
      module,
      module.exports,
      __webpack_require__
    ); // Return the exports of the module
    /******/
    /******/ /******/ return module.exports;
    /******/
  }
  /******/
  /************************************************************************/
  var __webpack_exports__ = {};
  // This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
  (() => {
    /*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
    let title = __webpack_require__(/*! ./title.js */ './src/title.js');
    console.log(title);
  })();

  /******/
})();
//# sourceMappingURL=main.js.map
```

### 2. commonJs - load - ES
```js
/******/ (() => {
  // webpackBootstrap
  /******/ var __webpack_modules__ = {
    /***/ './src/title.js':
      /*!**********************!*\
  !*** ./src/title.js ***!
  \**********************/
      /***/ (
        __unused_webpack_module,
        __webpack_exports__,
        __webpack_require__
      ) => {
        'use strict';
        __webpack_require__.r(__webpack_exports__);
        /* harmony export */ __webpack_require__.d(__webpack_exports__, {
          /* harmony export */ default: () => __WEBPACK_DEFAULT_EXPORT__,
          /* harmony export */ age: () => /* binding */ age,
          /* harmony export */
        });
        /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ =
          'title_name';
        const age = 'title_age';

        /***/
      },

    /******/
  }; // The module cache
  /************************************************************************/
  /******/ /******/ var __webpack_module_cache__ = {}; // The require function
  /******/
  /******/ /******/ function __webpack_require__(moduleId) {
    /******/ // Check if module is in cache
    /******/ var cachedModule = __webpack_module_cache__[moduleId];
    /******/ if (cachedModule !== undefined) {
      /******/ return cachedModule.exports;
      /******/
    } // Create a new module (and put it into the cache)
    /******/ /******/ var module = (__webpack_module_cache__[moduleId] = {
      /******/ // no module.id needed
      /******/ // no module.loaded needed
      /******/ exports: {},
      /******/
    }); // Execute the module function
    /******/
    /******/ /******/ __webpack_modules__[moduleId](
      module,
      module.exports,
      __webpack_require__
    ); // Return the exports of the module
    /******/
    /******/ /******/ return module.exports;
    /******/
  } /* webpack/runtime/define property getters */
  /******/
  /************************************************************************/
  /******/ /******/ (() => {
    /******/ // define getter functions for harmony exports
    /******/ __webpack_require__.d = (exports, definition) => {
      /******/ for (var key in definition) {
        /******/ if (
          __webpack_require__.o(definition, key) &&
          !__webpack_require__.o(exports, key)
        ) {
          /******/ Object.defineProperty(exports, key, {
            enumerable: true,
            get: definition[key],
          });
          /******/
        }
        /******/
      }
      /******/
    };
    /******/
  })(); /* webpack/runtime/hasOwnProperty shorthand */
  /******/
  /******/ /******/ (() => {
    /******/ __webpack_require__.o = (obj, prop) =>
      Object.prototype.hasOwnProperty.call(obj, prop);
    /******/
  })(); /* webpack/runtime/make namespace object */
  /******/
  /******/ /******/ (() => {
    /******/ // define __esModule on exports
    /******/ __webpack_require__.r = (exports) => {
      /******/ if (typeof Symbol !== 'undefined' && Symbol.toStringTag) {
        /******/ Object.defineProperty(exports, Symbol.toStringTag, {
          value: 'Module',
        });
        /******/
      }
      /******/ Object.defineProperty(exports, '__esModule', { value: true });
      /******/
    };
    /******/
  })();
  /******/
  /************************************************************************/
  var __webpack_exports__ = {};
  // This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
  (() => {
    /*!**********************!*\
      !*** ./src/index.js ***!
      \**********************/
    let title = __webpack_require__(/*! ./title */ './src/title.js');
    console.log(title);
    console.log(title.age);
  })();

  /******/
})();
//# sourceMappingURL=main.js.map
```


### 3. ES - load - ES
```js
/******/ (() => {
  // webpackBootstrap
  /******/ 'use strict';
  /******/ var __webpack_modules__ = {
    /***/ './src/title.js':
      /*!**********************!*\
  !*** ./src/title.js ***!
  \**********************/
      /***/ (
        __unused_webpack_module,
        __webpack_exports__,
        __webpack_require__
      ) => {
        __webpack_require__.r(__webpack_exports__);
        /* harmony export */ __webpack_require__.d(__webpack_exports__, {
          /* harmony export */ default: () => __WEBPACK_DEFAULT_EXPORT__,
          /* harmony export */ age: () => /* binding */ age,
          /* harmony export */
        });
        /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ =
          'title_name';
        const age = 'title_age';

        /***/
      },

    /******/
  }; // The module cache
  /************************************************************************/
  /******/ /******/ var __webpack_module_cache__ = {}; // The require function
  /******/
  /******/ /******/ function __webpack_require__(moduleId) {
    /******/ // Check if module is in cache
    /******/ var cachedModule = __webpack_module_cache__[moduleId];
    /******/ if (cachedModule !== undefined) {
      /******/ return cachedModule.exports;
      /******/
    } // Create a new module (and put it into the cache)
    /******/ /******/ var module = (__webpack_module_cache__[moduleId] = {
      /******/ // no module.id needed
      /******/ // no module.loaded needed
      /******/ exports: {},
      /******/
    }); // Execute the module function
    /******/
    /******/ /******/ __webpack_modules__[moduleId](
      module,
      module.exports,
      __webpack_require__
    ); // Return the exports of the module
    /******/
    /******/ /******/ return module.exports;
    /******/
  } /* webpack/runtime/define property getters */
  /******/
  /************************************************************************/
  /******/ /******/ (() => {
    /******/ // define getter functions for harmony exports
    /******/ __webpack_require__.d = (exports, definition) => {
      /******/ for (var key in definition) {
        /******/ if (
          __webpack_require__.o(definition, key) &&
          !__webpack_require__.o(exports, key)
        ) {
          /******/ Object.defineProperty(exports, key, {
            enumerable: true,
            get: definition[key],
          });
          /******/
        }
        /******/
      }
      /******/
    };
    /******/
  })(); /* webpack/runtime/hasOwnProperty shorthand */
  /******/
  /******/ /******/ (() => {
    /******/ __webpack_require__.o = (obj, prop) =>
      Object.prototype.hasOwnProperty.call(obj, prop);
    /******/
  })(); /* webpack/runtime/make namespace object */
  /******/
  /******/ /******/ (() => {
    /******/ // define __esModule on exports
    /******/ __webpack_require__.r = (exports) => {
      /******/ if (typeof Symbol !== 'undefined' && Symbol.toStringTag) {
        /******/ Object.defineProperty(exports, Symbol.toStringTag, {
          value: 'Module',
        });
        /******/
      }
      /******/ Object.defineProperty(exports, '__esModule', { value: true });
      /******/
    };
    /******/
  })();
  /******/
  /************************************************************************/
  var __webpack_exports__ = {};
  // This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
  (() => {
    /*!**********************!*\
    !*** ./src/index.js ***!
    \**********************/
    __webpack_require__.r(__webpack_exports__);
    /* harmony import */ var _title__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(
      /*! ./title */ './src/title.js'
    );

    console.log(_title__WEBPACK_IMPORTED_MODULE_0__.default);
    console.log(_title__WEBPACK_IMPORTED_MODULE_0__.age);
  })();

  /******/
})();
//# sourceMappingURL=main.js.map
```



### 4. ES - load - commonJs
```js
/******/ (() => {
  // webpackBootstrap
  /******/ var __webpack_modules__ = {
    /***/ './src/title.js':
      /*!**********************!*\
  !*** ./src/title.js ***!
  \**********************/
      /***/ (module) => {
        module.exports = {
          age: 18,
        };

        /***/
      },

    /******/
  }; // The module cache
  /************************************************************************/
  /******/ /******/ var __webpack_module_cache__ = {}; // The require function
  /******/
  /******/ /******/ function __webpack_require__(moduleId) {
    /******/ // Check if module is in cache
    /******/ var cachedModule = __webpack_module_cache__[moduleId];
    /******/ if (cachedModule !== undefined) {
      /******/ return cachedModule.exports;
      /******/
    } // Create a new module (and put it into the cache)
    /******/ /******/ var module = (__webpack_module_cache__[moduleId] = {
      /******/ // no module.id needed
      /******/ // no module.loaded needed
      /******/ exports: {},
      /******/
    }); // Execute the module function
    /******/
    /******/ /******/ __webpack_modules__[moduleId](
      module,
      module.exports,
      __webpack_require__
    ); // Return the exports of the module
    /******/
    /******/ /******/ return module.exports;
    /******/
  } /* webpack/runtime/compat get default export */
  /******/
  /************************************************************************/
  /******/ /******/ (() => {
    /******/ // getDefaultExport function for compatibility with non-harmony modules
    /******/ __webpack_require__.n = (module) => {
      /******/ var getter =
        module && module.__esModule
          ? /******/ () => module['default']
          : /******/ () => module;
      /******/ __webpack_require__.d(getter, { a: getter });
      /******/ return getter;
      /******/
    };
    /******/
  })(); /* webpack/runtime/define property getters */
  /******/
  /******/ /******/ (() => {
    /******/ // define getter functions for harmony exports
    /******/ __webpack_require__.d = (exports, definition) => {
      /******/ for (var key in definition) {
        /******/ if (
          __webpack_require__.o(definition, key) &&
          !__webpack_require__.o(exports, key)
        ) {
          /******/ Object.defineProperty(exports, key, {
            enumerable: true,
            get: definition[key],
          });
          /******/
        }
        /******/
      }
      /******/
    };
    /******/
  })(); /* webpack/runtime/hasOwnProperty shorthand */
  /******/
  /******/ /******/ (() => {
    /******/ __webpack_require__.o = (obj, prop) =>
      Object.prototype.hasOwnProperty.call(obj, prop);
    /******/
  })(); /* webpack/runtime/make namespace object */
  /******/
  /******/ /******/ (() => {
    /******/ // define __esModule on exports
    /******/ __webpack_require__.r = (exports) => {
      /******/ if (typeof Symbol !== 'undefined' && Symbol.toStringTag) {
        /******/ Object.defineProperty(exports, Symbol.toStringTag, {
          value: 'Module',
        });
        /******/
      }
      /******/ Object.defineProperty(exports, '__esModule', { value: true });
      /******/
    };
    /******/
  })();
  /******/
  /************************************************************************/
  var __webpack_exports__ = {};
  // This entry need to be wrapped in an IIFE because it need to be in strict mode.
  (() => {
    'use strict';
    /*!**********************!*\
    !*** ./src/index.js ***!
    \**********************/
    __webpack_require__.r(__webpack_exports__);
    /* harmony import */ var _title__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(
      /*! ./title */ './src/title.js'
    );
    /* harmony import */ var _title__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/ __webpack_require__.n(
      _title__WEBPACK_IMPORTED_MODULE_0__
    );

    console.log(_title__WEBPACK_IMPORTED_MODULE_0___default());
    console.log(_title__WEBPACK_IMPORTED_MODULE_0__.age);
  })();

  /******/
})();
//# sourceMappingURL=main.js.map
```

### 5. 异步加载
```js
// main.js
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/ensure chunk */
/******/ 	(() => {
/******/ 		__webpack_require__.f = {};
/******/ 		// This file contains only the entry chunk.
/******/ 		// The chunk loading function for additional chunks
/******/ 		__webpack_require__.e = (chunkId) => {
/******/ 			return Promise.all(Object.keys(__webpack_require__.f).reduce((promises, key) => {
/******/ 				__webpack_require__.f[key](chunkId, promises);
/******/ 				return promises;
/******/ 			}, []));
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/get javascript chunk filename */
/******/ 	(() => {
/******/ 		// This function allow to reference async chunks
/******/ 		__webpack_require__.u = (chunkId) => {
/******/ 			// return url for filenames based on template
/******/ 			return "" + chunkId + ".lee.js";
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/load script */
/******/ 	(() => {
/******/ 		var inProgress = {};
/******/ 		var dataWebpackPrefix = "webpack-source:";
/******/ 		// loadScript function to load a script via script tag
/******/ 		__webpack_require__.l = (url, done, key, chunkId) => {
/******/ 			if(inProgress[url]) { inProgress[url].push(done); return; }
/******/ 			var script, needAttach;
/******/ 			if(key !== undefined) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				for(var i = 0; i < scripts.length; i++) {
/******/ 					var s = scripts[i];
/******/ 					if(s.getAttribute("src") == url || s.getAttribute("data-webpack") == dataWebpackPrefix + key) { script = s; break; }
/******/ 				}
/******/ 			}
/******/ 			if(!script) {
/******/ 				needAttach = true;
/******/ 				script = document.createElement('script');
/******/ 		
/******/ 				script.charset = 'utf-8';
/******/ 				script.timeout = 120;
/******/ 				if (__webpack_require__.nc) {
/******/ 					script.setAttribute("nonce", __webpack_require__.nc);
/******/ 				}
/******/ 				script.setAttribute("data-webpack", dataWebpackPrefix + key);
/******/ 				script.src = url;
/******/ 			}
/******/ 			inProgress[url] = [done];
/******/ 			var onScriptComplete = (prev, event) => {
/******/ 				// avoid mem leaks in IE.
/******/ 				script.onerror = script.onload = null;
/******/ 				clearTimeout(timeout);
/******/ 				var doneFns = inProgress[url];
/******/ 				delete inProgress[url];
/******/ 				script.parentNode && script.parentNode.removeChild(script);
/******/ 				doneFns && doneFns.forEach((fn) => (fn(event)));
/******/ 				if(prev) return prev(event);
/******/ 			}
/******/ 			;
/******/ 			var timeout = setTimeout(onScriptComplete.bind(null, undefined, { type: 'timeout', target: script }), 120000);
/******/ 			script.onerror = onScriptComplete.bind(null, script.onerror);
/******/ 			script.onload = onScriptComplete.bind(null, script.onload);
/******/ 			needAttach && document.head.appendChild(script);
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/publicPath */
/******/ 	(() => {
/******/ 		var scriptUrl;
/******/ 		if (__webpack_require__.g.importScripts) scriptUrl = __webpack_require__.g.location + "";
/******/ 		var document = __webpack_require__.g.document;
/******/ 		if (!scriptUrl && document) {
/******/ 			if (document.currentScript)
/******/ 				scriptUrl = document.currentScript.src
/******/ 			if (!scriptUrl) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				if(scripts.length) scriptUrl = scripts[scripts.length - 1].src
/******/ 			}
/******/ 		}
/******/ 		// When supporting browsers where an automatic publicPath is not supported you must specify an output.publicPath manually via configuration
/******/ 		// or pass an empty string ("") and set the __webpack_public_path__ variable from your code to use your own logic.
/******/ 		if (!scriptUrl) throw new Error("Automatic publicPath is not supported in this browser");
/******/ 		scriptUrl = scriptUrl.replace(/#.*$/, "").replace(/\?.*$/, "").replace(/\/[^\/]+$/, "/");
/******/ 		__webpack_require__.p = scriptUrl;
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/jsonp chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded and loading chunks
/******/ 		// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 		// [resolve, reject, Promise] = chunk loading, 0 = chunk loaded
/******/ 		var installedChunks = {
/******/ 			"main": 0
/******/ 		};
/******/ 		
/******/ 		__webpack_require__.f.j = (chunkId, promises) => {
/******/ 				// JSONP chunk loading for javascript
/******/ 				var installedChunkData = __webpack_require__.o(installedChunks, chunkId) ? installedChunks[chunkId] : undefined;
/******/ 				if(installedChunkData !== 0) { // 0 means "already installed".
/******/ 		
/******/ 					// a Promise means "currently loading".
/******/ 					if(installedChunkData) {
/******/ 						promises.push(installedChunkData[2]);
/******/ 					} else {
/******/ 						if(true) { // all chunks have JS
/******/ 							// setup Promise in chunk cache
/******/ 							var promise = new Promise((resolve, reject) => (installedChunkData = installedChunks[chunkId] = [resolve, reject]));
/******/ 							promises.push(installedChunkData[2] = promise);
/******/ 		
/******/ 							// start chunk loading
/******/ 							var url = __webpack_require__.p + __webpack_require__.u(chunkId);
/******/ 							// create error before stack unwound to get useful stacktrace later
/******/ 							var error = new Error();
/******/ 							var loadingEnded = (event) => {
/******/ 								if(__webpack_require__.o(installedChunks, chunkId)) {
/******/ 									installedChunkData = installedChunks[chunkId];
/******/ 									if(installedChunkData !== 0) installedChunks[chunkId] = undefined;
/******/ 									if(installedChunkData) {
/******/ 										var errorType = event && (event.type === 'load' ? 'missing' : event.type);
/******/ 										var realSrc = event && event.target && event.target.src;
/******/ 										error.message = 'Loading chunk ' + chunkId + ' failed.\n(' + errorType + ': ' + realSrc + ')';
/******/ 										error.name = 'ChunkLoadError';
/******/ 										error.type = errorType;
/******/ 										error.request = realSrc;
/******/ 										installedChunkData[1](error);
/******/ 									}
/******/ 								}
/******/ 							};
/******/ 							__webpack_require__.l(url, loadingEnded, "chunk-" + chunkId, chunkId);
/******/ 						} else installedChunks[chunkId] = 0;
/******/ 					}
/******/ 				}
/******/ 		};
/******/ 		
/******/ 		// no prefetching
/******/ 		
/******/ 		// no preloaded
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 		
/******/ 		// no on chunks loaded
/******/ 		
/******/ 		// install a JSONP callback for chunk loading
/******/ 		var webpackJsonpCallback = (parentChunkLoadingFunction, data) => {
/******/ 			var [chunkIds, moreModules, runtime] = data;
/******/ 			// add "moreModules" to the modules object,
/******/ 			// then flag all "chunkIds" as loaded and fire callback
/******/ 			var moduleId, chunkId, i = 0;
/******/ 			for(moduleId in moreModules) {
/******/ 				if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 					__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 				}
/******/ 			}
/******/ 			if(runtime) runtime(__webpack_require__);
/******/ 			if(parentChunkLoadingFunction) parentChunkLoadingFunction(data);
/******/ 			for(;i < chunkIds.length; i++) {
/******/ 				chunkId = chunkIds[i];
/******/ 				if(__webpack_require__.o(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 					installedChunks[chunkId][0]();
/******/ 				}
/******/ 				installedChunks[chunkIds[i]] = 0;
/******/ 			}
/******/ 		
/******/ 		}
/******/ 		
/******/ 		var chunkLoadingGlobal = self["webpackChunkwebpack_source"] = self["webpackChunkwebpack_source"] || [];
/******/ 		chunkLoadingGlobal.forEach(webpackJsonpCallback.bind(null, 0));
/******/ 		chunkLoadingGlobal.push = webpackJsonpCallback.bind(null, chunkLoadingGlobal.push.bind(chunkLoadingGlobal));
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
__webpack_require__.e(/*! import() | hello */ "hello").then(__webpack_require__.bind(__webpack_require__, /*! ./hello */ "./src/hello.js")).then((result) => {
  console.log(result.default);
});

/******/ })()
;
//# sourceMappingURL=main.js.map
```
```js
// hello.js
(self["webpackChunkwebpack_source"] = self["webpackChunkwebpack_source"] || []).push([["hello"],{

/***/ "./src/hello.js":
/*!**********************!*\
  !*** ./src/hello.js ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ('hello');


/***/ })

}]);
//# sourceMappingURL=hello.js.map
```