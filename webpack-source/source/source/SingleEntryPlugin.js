class SingleEntryPlugin {
  constructor(context, entry, name) {
    this.context = context //上下文绝对路径
    this.entry = entry //入口模块路径 ./src/index.js
    this.name = name //入口的名字main
  }
  apply(compiler) {
    compiler.hooks.make.tapAsync(
      'SingleEntryPlugin',
      (compilation, callback) => {
        // 15. 监听到 make 钩子触发 执行该函数
        const { context, entry, name } = this
        // 16. 调用 addEntry 方法，从入口模块开始编译
        compilation.addEntry(context, entry, name, callback)
      },
    )
  }
}
module.exports = SingleEntryPlugin
