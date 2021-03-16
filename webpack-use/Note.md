## 介绍
webpack 本质上是一个用于现代 Java Script 应用程序的静态模块打包工具，它工作时会在内部构建一个**依赖图**，此依赖图对应映射到项目的所需的每个模块，并生成一个或多个bundle。

## 打包环境设置
- --mode 设置模块内的 peocess.env.NODE_ENV **（模块内使用变量）**
- --env 设置 webpack 配置文件的函数参数 **（在配置文件中通过函数接收变量）**
- cross-env 设置 node 环境的 peocess.env.NODE_ENV **（配置文件中使用）** 
```js
cross-env NODE_ENV=developmen
```
- DefinePlugin 用来设置模块内的全局变量 可以在任意模块内通过 process.env.NODE_ENV 获取当前的环境变量 但无法在node环境(webpack 配置文件中)下获取当前的环境变量 **（模块内使用变量）**
```js
plugins:[
   new webpack.DefinePlugin({
      'process.env.NODE_ENV':JSON.stringify('development'), // value 部分会被当做表达式执行
   })
] 
```

## 打包第三方库
**1. 配置 ProvidePlugin 后，在使用时将不再需要 import 和 require 进行引入，直接使用即可**
```js
new webpack.ProvidePlugin({
    _:'lodash'
})
```
**2. expose-loader 可以把模块添加到全局对象上 需要代码中先引入该模块**
```js
module: {
  rules: [
    {
      test: require.resolve('lodash'),
      loader: 'expose-loader',
      options: {
          exposes: {
              globalName: '_',
              override: true,
          },
      },
    }
  ]
}
```
**3. externals 想引用一个库，但是又不想让 webpack 打包，并且又不影响我们在程序中以CMD、AMD 或者 window/global 全局等方式进行使用，那就可以通过配置 externals**
```js
externals: {
  lodash: '_',
},
```
**4. html-webpack-externals-plugin 外链CDN**
```js
const HtmlWebpackExternalsPlugin = require('html-webpack-externals-plugin');
new HtmlWebpackExternalsPlugin({
  externals: [
    {
      module: 'lodash', // 模块名
      entry: "https://cdn.bootcdn.net/ajax/libs/lodash.js/4.17.20/lodash.js",
      global: '_', // 全局变量名
    },
  ],
}),
```

## Sourcemap 
- 五个关键字 eval、source-map、cheap、module 和 inline
- eval 生成代码 每个模块都被eval执行，并且存在@sourceURL,带eval的构建模式能缓存 SourceMap 重新构建性能更高
- source-map 原始代码 最好的sourcemap质量有完整的结果，但是会很慢
- cheap 不包含列信息 也不包含loader 的 sourcemap
- module 包含 loader 的 sourcemap 会追踪到经过 loader 转换前的源代码
- inline 将.map作为DataURI嵌入，不单独生成.map文件
  
  **组合规则**
- [inline-|hidden-|eval-][nosources-][cheap-[module-]]source-map
- source-map 单独在外部生成完整的sourcemap文件，并且在目标文件里建立关联,能提示错误代码的准确原始位置
- inline-source-map 以base64格式内联在打包后的文件中，内联构建速度更快,也能提示错误代码的准确原始位置
- hidden-source-map 会在外部生成sourcemap文件,但是在目标文件里没有建立关联,不能提示错误代码的准确原始位置
- eval-source-map 会为每一个模块生成一个单独的sourcemap文件进行内联，并使用eval执行
- nosources-source-map 也会在外部生成sourcemap文件,能找到源始代码位置，但源代码内容为空
- cheap-source-map 外部生成sourcemap文件,不包含列和loader的map
- cheap-module-source-map 外部生成sourcemap文件,不包含列的信息但包含loader的map
  
  **最佳实践**
- 开发环境 速度快 调试友好 eval-cheap-module-source-map
- 生产环境 hidden-source-map 隐藏 source-map

  **生产环境调试**
```js
const FileManagerPlugin = require('filemanager-webpack-plugin');
{
  plugins:[
    new webpack.SourceMapDevToolPlugin({
      append: '\n//# sourceMappingURL=http://127.0.0.1:8081/[url]',
      filename: '[file].map', // 定义生成的 source map 的名称（如果没有值将会变成 inlined）。
    }),
    new FileManagerPlugin({
      events: {
        onEnd: {
          copy: [{
            source: './dist/*.map', // 生成map的目录
            destination: path.resolve(__dirname,'./'), // map 存放地址
          }],
          delete: ['./dist/*.map'], // 删除打包后生成的 map
        },
      },
    }),
  ]
}
```

## Babel 
- Babel 是一个编译 js 的平台，可以把 ES6、ES7, React 的 JSX 转义为 ES5
- babel-loader 使用 Babel 和 webpack 转译 JavaScript 文件
- @babel/core Babel 编译的核心包 只负责将代码解析成语法树
- @babel/preset-env 预设 根据这个来决定怎么进行转换 
- @babel/preset-react React插件的Babel预设
- @babel/plugin-proposal-decorators 把类和对象装饰器编译成ES5
- @babel/plugin-proposal-class-properties 转换静态类属性以及使用属性初始值化语法声明的属性

### babel-polyfill
- Babel 默认只转换新的 javascript 语法，而不转换新的API，比如 Iterator, Generator, Set, Maps, Proxy, Reflect,Symbol,Promise 等全局对象。以及一些在全局对象上的方法(比如 Object.assign)都不会转码，**如果想让这些方法运行，必须使用 babel-polyfill 来转换**
- **babel-polyfill 它是通过向全局对象和内置对象的 prototype 上添加方法来实现的**。比如运行环境中不支持Array.prototype.find方法，引入polyfill，我们就可以使用es6方法来编写了，但是**缺点就是会造成全局空间污染**

  #### 使用方法：
  在 @babel/preset-env 下做预设
  - "useBuiltIns": false 此时不对 polyfill 做操作。如果引入 @babel/polyfill，则无视配置的浏览器兼容，引入所有的 polyfill
  - "useBuiltIns": "entry" 根据配置的浏览器兼容，引入浏览器不兼容的 polyfill。需要在入口文件手动添加 import '@babel/polyfill'，会自动根据 browserslist 替换成浏览器不兼容的所有 polyfill，这里需要指定 core-js 的版本, 如果 "corejs": 3, 则 import '@babel/polyfill' 需要改成 import 'core-js/stable';import 'regenerator-runtime/runtime';
  - "useBuiltIns": "usage" usage 会根据配置的浏览器兼容，以及你代码中用到的 API 来进行 polyfill，实现了按需添加
  ```js
  {
    test: /\.jsx?$/,
    use: {
      loader: 'babel-loader',
      options: {
        presets: [
          [
            '@babel/preset-env', // 预设 根据这个来决定怎么进行转换
            {
              useBuiltIns: 'usage',
              corejs: { version: 3 },
              // targets: '> 0.25%, not dead',
            },
          ],
        ],
      },
    },
  },
  ```
### babel-runtime
- Babel 为了**解决全局空间污染的问题**，提供了单独的包 babel-runtime 用以提供编译模块的工具函数
- babel-runtime 更像是一种按需加载的实现，比如你哪里需要使用 Promise，只要在这个文件头部**require Promise from 'babel-runtime/core-js/promise'**就行了
```js
import Promise from 'babel-runtime/core-js/promise';
const p = new Promise(()=> {});
console.log(p);
```
  #### babel-plugin-transform-runtime 自动引入对应的polyfill
  - 启用插件babel-plugin-transform-runtime后，Babel就会使用babel-runtime下的工具函数。
  - babel-plugin-transform-runtime插件能够将这些工具函数的代码**转换成require语句**，指向为对babel-runtime的引用
  ```js
  {
    test: /\.jsx?$/,
    use: {
      loader: 'babel-loader',
      options: {
        plugins:[
          [
            "@babel/plugin-transform-runtime",
            {
              corejs: 2,//当我们使用 ES6 的静态事件或内置对象时自动引入 babel-runtime/core-js
              helpers: true,//移除内联babel helpers并替换使用babel-runtime/helpers 来替换
              regenerator: true,//是否开启generator函数转换成使用regenerator runtime来避免污染全局域
            },
          ],
        ]
      },
    },
  },
  ```
**总结：babel-runtime适合在组件和类库项目中使用，而babel-polyfill适合在业务项目中使用。**
### polyfill-service 自动化的 JavaScript Polyfill 服务 通过分析请求头信息中的 UserAgent 实现自动加载浏览器所需的 polyfills
```js
<script src="https://polyfill.io/v3/polyfill.min.js"></script>
```
