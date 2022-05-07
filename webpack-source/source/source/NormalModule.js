const path = require('path')
const types = require('babel-types')
const generate = require('babel-generator').default
const traverse = require('babel-traverse').default
const async = require('neo-async')
const { runLoaders } = require('./loader-runner')
class NormalModule {
  constructor({
    name,
    context,
    rawRequest,
    resource,
    parser,
    moduleId,
    async,
  }) {
    this.name = name
    this.context = context
    this.rawRequest = rawRequest
    this.resource = resource //这是这个模块的绝对路径
    //这是AST解析器,可以把源代码转成AST抽象语法树
    this.parser = parser
    this.moduleId = moduleId || './' + path.posix.relative(context, resource)
    //此模块对应的源代码
    this._source
    //此模块对应的AST抽象语法树
    this._ast
    //当前模块依赖的模块信息
    this.dependencies = []
    //当前模块依赖哪些异步模块 import(那些模块)
    this.blocks = []
    //表示当前的模块是属于一个异步代码块,还是一个同步代码块
    this.async = async
  }
  /**
   * 编译本模块
   * @param {*} compilation
   * @param {*} callback
   */
  build(compilation, callback) {
    this.doBuild(compilation, (err) => {
      // 26. 使用解析器，将最终转义的代码解析成 ast 语法树
      this._ast = this.parser.parse(this._source)
      // 27. 遍历语法树，找到里面的依赖进行收集依赖
      traverse(this._ast, {
        CallExpression: (nodePath) => {
          let node = nodePath.node
          // 28. 处理 require 的正常模块依赖收集
          if (node.callee.name === 'require') {
            // 29. 把方法名用require改成了__webpack_require__
            node.callee.name = '__webpack_require__'
            let moduleName = node.arguments[0].value // 模块的名称
            // 依赖的绝对路径
            let depResource
            // 如果说模块的名字是以.开头,说明是一个本地模块,或者说用户自定义模块
            if (moduleName.startsWith('.')) {
              // 获得可能的扩展名
              let extName =
                moduleName.split(path.posix.sep).pop().indexOf('.') == -1
                  ? '.js'
                  : ''
              // 获取依赖模块(./src/title.js)的绝对路径
              // C:\aproject\zhufeng202009webpack\8.my\src\title.js
              depResource = path.posix.join(
                path.posix.dirname(this.resource),
                moduleName + extName,
              )
            } else {
              // 否则是一个第三方模块,也就是放在node_modules里的
              // C:\aproject\zhufeng202009webpack\8.my\node_modules\isarray\index.js
              depResource = require.resolve(
                path.posix.join(this.context, 'node_modules', moduleName),
              )
              depResource = depResource.replace(/\\/g, '/') // 把window里的 \转成 /
            }
            // 依赖的模块ID ./+从根目录出发到依赖模块的绝对路径的相对路径
            let depModuleId = '.' + depResource.slice(this.context.length)
            // 30. 把 require 模块路径从 ./title.js 变成了 ./src/title.js
            node.arguments = [types.stringLiteral(depModuleId)]
            // 31. 收集依赖模块到 module 的 dependencies 属性
            this.dependencies.push({
              name: this.name, //main
              context: this.context, //根目录
              rawRequest: moduleName, //模块的相对路径 原始路径
              moduleId: depModuleId, //模块ID 它是一个相对于根目录的相对路径,以./开头
              resource: depResource, //依赖模块的绝对路径
            })
          } else if (types.isImport(node.callee)) {
            // 32. 处理 import() 动态导入的 异步代码块
            let moduleName = node.arguments[0].value // 模块的名称 ./title.js
            // 获得了可能的扩展名
            let extName =
              moduleName.split(path.posix.sep).pop().indexOf('.') == -1
                ? '.js'
                : ''
            // 获取依赖的模块的绝对路径
            let depResource = path.posix.join(
              path.posix.dirname(this.resource),
              moduleName + extName,
            )
            // 依赖的模块ID ./+从根目录出发到依赖模块的绝对路径的相对路径 ./src/title.js
            let depModuleId =
              './' + path.posix.relative(this.context, depResource)

            let chunkName = compilation.asyncChunkCounter++
            if (
              Array.isArray(node.arguments[0].leadingComments) &&
              node.arguments[0].leadingComments.length > 0
            ) {
              let leadingComments = node.arguments[0].leadingComments[0].value
              let regexp = /webpackChunkName:\s*['"]([^'"]+)['"]/
              chunkName = leadingComments.match(regexp)[1]
            }
            // 33. 将 import() 调换成 require.e().require()
            nodePath.replaceWithSourceString(
              `__webpack_require__.e("${chunkName}").then(__webpack_require__.t.bind(null,"${depModuleId}", 7))`,
            )
            // 34. 收集异步代码块的依赖
            this.blocks.push({
              context: this.context,
              entry: depModuleId,
              name: chunkName,
              async: true, //异步的代码块
            })
          }
        },
      })
      // 35. 依赖模块收集完毕之后，把转换后的语法树重新生成源代码
      let { code } = generate(this._ast)
      this._source = code
      // 36. 循环构建每一个异步代码块,都构建完成才会代表当前的模块编译完成
      async.forEach(
        this.blocks,
        (block, done) => {
          let { context, entry, name, async } = block
          compilation._addModuleChain(context, entry, name, async, done)
        },
        callback,
      )
    })
  }
  /**
   * 1.读取模块的源代码
   * @param {*} compilation
   * @param {*} callback
   */
  doBuild(compilation, callback) {
    // 24. 根据该模块配置的 loader，使用 loader-runner 执行 loader
    // 25. 读取模块源代码使用 loader 进行代码转译，将最终的代码存放到 module._source 中
    this.getSource(compilation, (err, source) => {
      let {
        module: { rules },
      } = compilation.options
      let loaders = []
      for (let i = 0; i < rules.length; i++) {
        let rule = rules[i]
        if (rule.test.test(this.resource)) {
          loaders.push(...rule.use)
        }
      }
      //loader的绝对路径的数组
      const resolveLoader = (loader) =>
        require.resolve(path.posix.join(this.context, 'loaders', loader))
      loaders = loaders.map(resolveLoader)
      runLoaders(
        {
          resource: this.resource,
          loaders,
        },
        (err, { result }) => {
          this._source = result.toString()
          console.log(this._source)
          callback()
        },
      )
    })
  }
  /**
   * 读取真正的源代码
   */
  getSource(compilation, callback) {
    //fs.readFile读文件
    compilation.inputFileSystem.readFile(this.resource, 'utf8', callback)
  }
}

module.exports = NormalModule
/**
 * 1.从硬盘上把模块内容读出来,读成一个文本
 * 2.可能它不是一个JS模块,所以会可能要走loader的转换,最终肯定要得到一个JS模块代码,得不到就报错了
 * 3.把这个JS模块代码经过parser处理转成抽象语法树AST
 * 4.分析AST里面的依赖,也就是找 require import节点,分析依赖的模块
 * 5.递归的编译依赖的模块
 * 6.不停的依次递归执行上面5步,直到所有的模块都编译完成为止
 */

/**
 * 非常的重要的问题
 * 模块的ID的问题
 * 不管你是相对的本地模 块,还是三方模块
 * 最后它的moduleId 全部都一个相对相对于项目根目录打对路径
 * ./src/title.js
 * ./src/index.js
 * ./node_modules/util/util.js
 * 路径分隔符一定是linux /,而非window里的\
 */

/**
 * 如何处理懒加载
 * 1.先把代码转成AST语法树
 * 2.找出动态import节点
 */
