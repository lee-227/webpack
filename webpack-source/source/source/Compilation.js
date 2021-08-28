let { Tapable, SyncHook } = require('tapable')
let async = require('neo-async')
const NormalModuleFactory = require('./NormalModuleFactory')
const normalModuleFactory = new NormalModuleFactory()
const Parser = require('./Parser')
const parser = new Parser()
const path = require('path')
const Chunk = require('./Chunk')
const ejs = require('ejs')
const fs = require('fs')
const mainTemplate = fs.readFileSync(
  path.join(__dirname, 'templates', 'deferMain.ejs'),
  'utf8',
)
const mainRender = ejs.compile(mainTemplate)
const chunkTemplate = fs.readFileSync(
  path.join(__dirname, 'templates', 'chunk.ejs'),
  'utf8',
)
const chunkRender = ejs.compile(chunkTemplate)
class Compilation extends Tapable {
  constructor(compiler) {
    super()
    this.compiler = compiler //编译器对象
    this.options = compiler.options // 选项一样
    this.context = compiler.context //根目录
    this.inputFileSystem = compiler.inputFileSystem //读取文件模块fs
    this.outputFileSystem = compiler.outputFileSystem //写入文件的模块fs
    this.entries = [] //入口模块的数组,这里放着所有的入口模块
    this.modules = [] //模块的数组,这里放着所有的模块
    this._modules = {} //key是模块ID ,值是模块对象
    this.chunks = [] //这里放着所有代码块
    this.files = [] //这里放着本次编译所有的产出的文件名
    this.assets = {} //存放 着生成资源 key是文件名 值是文件的内容
    this.vendors = [] //放着所有的第三方模块 isarray
    this.commons = [] //这里放着同时被多个代码块加载的模块  title.js
    this.moduleCount = {} //可以记录每个模块被代码块引用的次数,如果大于等于2,就分离出到commons里
    this.hooks = {
      //当你成功构建完成一个模块后就会触发此钩子执行
      succeedModule: new SyncHook(['module']),
      seal: new SyncHook(),
      beforeChunks: new SyncHook(),
      afterChunks: new SyncHook(),
    }
  }

  /**
   * 开始编译一个新的入口
   * @param {*} context  根目录
   * @param {*} entry 入口模块的相对路径 ./src/index.js
   * @param {*} name 入口的名字 main
   * @param {*} callback 编译完成的回调
   */
  addEntry(context, entry, name, finalCallback) {
    // 17. 从入口模块开始 编译整个模块链
    this._addModuleChain(context, entry, name, false, (err, module) => {
      finalCallback(err, module)
    })
  }
  _addModuleChain(context, rawRequest, name, async, callback) {
    // 18. 创建模块
    this.createModule(
      {
        name,
        context,
        rawRequest,
        parser,
        resource: path.posix.join(context, rawRequest),
        moduleId:
          './' +
          path.posix.relative(context, path.posix.join(context, rawRequest)),
        async,
      },
      (entryModule) => this.entries.push(entryModule),
      callback,
    )
  }
  /**
   * 创建并编译一个模块
   * @param {*} data 要编译的模块信息
   * @param {*} addEntry  可选的增加入口的方法 如果这个模块是入口模块,如果不是的话,就什么不做
   * @param {*} callback 编译完成后可以调用callback回调
   */
  createModule(data, addEntry, callback) {
    // 19. 通过模块工厂创建一个模块
    let module = normalModuleFactory.create(data)
    // 20. 将该入口模块添加到 entires 中
    addEntry && addEntry(module) //如果是入口模块,则添加入口里去
    // 21. 将该模块存储到 modules 中
    this.modules.push(module)
    this._modules[module.moduleId] = module

    const afterBuild = (err, module) => {
      // 38. 递归处理依赖的其他模块
      if (module.dependencies.length > 0) {
        this.processModuleDependencies(module, (err) => {
          callback(err, module)
        })
      } else {
        callback(err, module)
      }
    }
    // 22. 开始真正进行编译工作
    this.buildModule(module, afterBuild)
  }
  /**
   * 处理编译模块依赖
   * @param {*} module ./src/index.js
   * @param {*} callback
   */
  processModuleDependencies(module, callback) {
    // 39. 获取当前模块的依赖模块
    let dependencies = module.dependencies
    // 40. 遍历依赖模块，全部开始编译，把所有的依赖模块全部编译完成
    async.forEach(
      dependencies,
      (dependency, done) => {
        let { name, context, rawRequest, resource, moduleId } = dependency
        this.createModule(
          {
            name,
            context,
            rawRequest,
            parser,
            resource,
            moduleId,
          },
          null,
          done,
        )
      },
      callback,
    )
  }
  /**
   * 编译模块
   * @param {*} module 要编译的模块
   * @param {*} afterBuild 编译完成后的后的回调
   */
  buildModule(module, afterBuild) {
    // 23. 调用module.build方法进行模块编译
    module.build(this, (err) => {
      // 37. 一个模块编译完成 触发 succeedModule 钩子
      this.hooks.succeedModule.call(module)
      afterBuild(err, module)
    })
  }
  /**
   * 把模块封装成代码块Chunk
   * @param {*} callback
   */
  seal(callback) {
    // 42. 触发 seal beforeChunks 钩子 开始封装 chunk
    this.hooks.seal.call()
    this.hooks.beforeChunks.call()
    // 43. 循环所有的modules数组，根据配置的 splitChunks 规则，进行代码分割
    for (const module of this.modules) {
      // 44. 默认的 vendor 缓存组，收集第三方的库，生成 vendor 代码块
      if (/node_modules/.test(module.moduleId)) {
        module.name = 'vendors'
        if (!this.vendors.find((item) => item.moduleId === module.moduleId))
          this.vendors.push(module)
      } else {
        // 45. 默认配置的 commons 缓存组，收集被多次引用的模块，生成 commns 代码块
        let count = this.moduleCount[module.moduleId]
        if (count) {
          this.moduleCount[module.moduleId].count++
        } else {
          //如果没有,则给它赋初始值 {module,count} count是模块的引用次数
          this.moduleCount[module.moduleId] = { module, count: 1 }
        }
      }
    }
    for (let moduleId in this.moduleCount) {
      const { module, count } = this.moduleCount[moduleId]
      if (count >= 2) {
        module.name = 'commons'
        this.commons.push(module)
      }
    }
    // 46. 收集该模块依赖的其他代码块，供运行时代码使用
    let deferredModuleIds = [...this.vendors, ...this.commons].map(
      (module) => module.moduleId,
    )
    this.modules = this.modules.filter(
      (module) => !deferredModuleIds.includes(module.moduleId),
    )

    // 47. 每个入口模块生成一个代码块
    for (const entryModule of this.entries) {
      const chunk = new Chunk(entryModule)
      this.chunks.push(chunk)
      // 48. 过滤获取入口模块依赖的其他普通模块
      chunk.modules = this.modules.filter(
        (module) => module.name === chunk.name,
      )
    }
    // 48. 生成 第三方 代码块
    if (this.vendors.length > 0) {
      const chunk = new Chunk(this.vendors[0])
      chunk.async = true
      this.chunks.push(chunk)
      chunk.modules = this.vendors
    }
    // 49. 生成 commons 代码块
    if (this.commons.length > 0) {
      const chunk = new Chunk(this.commons[0])
      chunk.async = true
      this.chunks.push(chunk)
      chunk.modules = this.commons
    }
    // 50. 代码块生成结束，触发 afterChunks 钩子
    this.hooks.afterChunks.call(this.chunks)
    // 51. 根据生成的代码块转换成文件
    this.createChunkAssets()
    // 54. chunk 生成结束 调用 compiler 传入的回调函数
    callback()
  }
  createChunkAssets() {
    // 52. 遍历所有的代码块 根据代码块特征，注入不同的运行时代码
    // 53. 将转换后的代码 写入 assets 输出列表，这里都是待生成的文件
    for (let i = 0; i < this.chunks.length; i++) {
      const chunk = this.chunks[i]
      const file = chunk.name + '.js'
      chunk.files.push(file)
      let source
      if (chunk.async) {
        source = chunkRender({
          chunkName: chunk.name, // ./src/index.js
          modules: chunk.modules, // 此代码块对应的模块数组[{moduleId:'./src/index.js'},{moduleId:'./src/title.js'}]
        })
      } else {
        let deferredChunks = []
        if (this.vendors.length > 0) deferredChunks.push('vendors')
        if (this.commons.length > 0) deferredChunks.push('commons')
        source = mainRender({
          entryModuleId: chunk.entryModule.moduleId, // ./src/index.js
          deferredChunks,
          modules: chunk.modules, //此代码块对应的模块数组[{moduleId:'./src/index.js'},{moduleId:'./src/title.js'}]
        })
      }

      this.emitAssets(file, source)
    }
  }
  emitAssets(file, source) {
    this.assets[file] = source
    this.files.push(file)
  }
}
module.exports = Compilation
