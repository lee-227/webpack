// 1. 引入核心模块
const webpack = require('webpack');
// 2. 获取配置参数
const webpackOptions = require('./webpack.config');
// 3. 执行wenpack 传入参数 获取 Compiler 对象，webpack 的核心对象
const compiler = webpack(webpackOptions);
// 4. 调用run方法开始执行编译
compiler.run();
