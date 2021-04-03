const Compiler = require('./Compiler');
function webpack(options) {
  // 1. 初始化参数：从配置文件跟命令行中读取并合并参数。
  // 命令行参数处理 --mode=development
  let shellConfig = process.argv.slice(2).reduce((config, arg) => {
    let [key, value] = arg.split('=');
    config[key.slice(2)] = value;
    return config;
  }, {});
  // 配置文件参数跟命令行参数 合并
  Object.assign(options, shellConfig);
  // 2. 使用最终的参数初始化Compiler对象
  let compiler = new Compiler(options);
  // 3. 加载所有的插件 调用插件的apply方法并将compiler对象传递进去，
  // 所以插件的加载是在编译一开始就已经挂载了，只是等到对应的钩子执行才会执行对应的插件
  if (options.plugins && Array.isArray(options.plugins)) {
    for (const plugin of options.plugins) {
      plugin.apply(compiler);
    }
  }
  return compiler;
}
module.exports = webpack;
