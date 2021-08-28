const Compiler = require('./Compiler')
const NodeEnvironmentPlugin = require('./node/NodeEnvironmentPlugin')
const WebpackOptionsApply = require('./WebpackOptionsApply')
const webpack = (options) => {
  // 1. 验证配置参数正确性
  // 2. 与默认参数合并
  let compiler = new Compiler(options.context) // 3. 创建一个Compiler实例
  compiler.options = options
  new NodeEnvironmentPlugin().apply(compiler) //4. 给 compiler 添加可以读文件和写文件的方法
  // 4. 挂载配置文件里提供的所有的 plugins
  if (options.plugins && Array.isArray(options.plugins)) {
    for (const plugin of options.plugins) {
      plugin.apply(compiler)
    }
  }
  // 5. 初始化选项,挂载 webpack 的内置插件
  new WebpackOptionsApply().process(options, compiler)
  // 6. 插件中有一个 EntryOptionsPlugin  处理接口模块，主要是监听了 make 钩子，当触发 make 钩子时，调用 compilition 的 addEntry 方法开始编译
  return compiler
}

exports = module.exports = webpack
