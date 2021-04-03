class ReadmePlugin {
  constructor(options) {
    this.options = options;
  }
  // 插件必须拥有一个apply方法，在webpack刚开始编译的时候就会调用插件的apply方法进行插件的挂载并传入compiler对象
  apply(compiler) {
    // 通过compiler监听感兴趣的钩子，等到钩子执行时就会执行注册的回调函数
    compiler.hooks.emit.tap('ReadmePlugin', () => {
      compiler.assets['readme.md'] = '## 说明文档';
    });
  }
}
module.exports = ReadmePlugin;
