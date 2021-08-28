const {
  Tapable,
  SyncHook,
  SyncBailHook,
  AsyncSeriesHook,
  AsyncParallelHook,
} = require('tapable')
let NormalModuleFactory = require('./NormalModuleFactory')
let Compilation = require('./Compilation')
let Stats = require('./Stats')
const mkdirp = require('mkdirp') //递归的创建新的文件夹
const path = require('path')
class Compiler extends Tapable {
  constructor(context) {
    super()
    this.context = context
    this.hooks = {
      entryOption: new SyncBailHook(['context', 'entry']),
      beforeRun: new AsyncSeriesHook(['compiler']), //运行前
      run: new AsyncSeriesHook(['compiler']), //运行
      beforeCompile: new AsyncSeriesHook(['params']), //编译前
      compile: new SyncHook(['params']), //编译
      make: new AsyncParallelHook(['compilation']), //make构建//TODO
      thisCompilation: new SyncHook(['compilation', 'params']), //开始一次新的编译
      compilation: new SyncHook(['compilation', 'params']), //创建完成一个新的compilation
      afterCompile: new AsyncSeriesHook(['compilation']), //编译完成
      emit: new AsyncSeriesHook(['compilation']), // 发射或者说写入
      done: new AsyncSeriesHook(['stats']), //所有的编译全部都完成
    }
  }
  emitAssets(compilation, callback) {
    const emitFiles = (err) => {
      const assets = compilation.assets
      let outputPath = this.options.output.path //dist
      for (let file in assets) {
        let source = assets[file]
        let targetPath = path.posix.join(outputPath, file)
        this.outputFileSystem.writeFileSync(targetPath, source, 'utf8')
      }
      callback()
    }
    // 56. 触发 emit 钩子，在写插件的时候 emit 用的很多，因为它是我们修改输出内容的最后机会
    this.hooks.emit.callAsync(compilation, () => {
      // 57. 把生成的 chunk 变成文件，写入硬盘
      mkdirp(this.options.output.path, emitFiles)
    })
  }
  // 7. run方法是开始编译的入口
  run(callback) {
    const onCompiled = (err, compilation) => {
      this.emitAssets(compilation, (err) => {
        // 58. 先收集编译信息 chunks entries modules files
        let stats = new Stats(compilation)
        // 59. 触发done这个钩子，执行完毕
        this.hooks.done.callAsync(stats, (err) => {
          callback(err, stats)
        })
      })
    }
    // 8. 触发 beforeRun 跟 run 钩子 开始进行编译
    this.hooks.beforeRun.callAsync(this, (err) => {
      this.hooks.run.callAsync(this, (err) => {
        // 9. 调用 compile 进行编译
        this.compile(onCompiled)
      })
    })
  }
  compile(onCompiled) {
    // 10. 为 compilition 对象准备参数，主要是 模块的工厂函数 例如 NormalModalFactory
    const params = this.newCompilationParams()
    this.hooks.beforeCompile.callAsync(params, (err) => {
      this.hooks.compile.call(params)
      // 11. 创建一个新compilation对象
      const compilation = this.newCompilation(params)
      // 14. 触发 make 钩子的回调函数执行
      this.hooks.make.callAsync(compilation, (err) => {
        // 41. 当所有模块编译完成后 调用 seal 进行 chunk 封装
        compilation.seal((err) => {
          // 55. 触发 afterCompile 钩子 全部编译结束
          this.hooks.afterCompile.callAsync(compilation, (err) => {
            onCompiled(err, compilation)
          })
        })
      })
    })
  }
  createCompilation() {
    return new Compilation(this)
  }
  newCompilation(params) {
    // 12. new Compilition 获取 compilition 对象
    const compilation = this.createCompilation()
    // 13. 触发 compilition 钩子
    this.hooks.thisCompilation.call(compilation, params)
    this.hooks.compilation.call(compilation, params)
    return compilation
  }
  newCompilationParams() {
    const params = {
      //在创建compilation这前已经创建了一个普通模块工厂
      normalModuleFactory: new NormalModuleFactory(), //TODO
    }
    return params
  }
}

module.exports = Compiler
