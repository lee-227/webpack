const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
  console.log('env', env);
  console.log('argv', argv);

  return {
    // production 模式:会将模块内的 process.env.NODE_ENV 的值设为 production。
    // 默认会启用各种性能优化的功能，包括构建结果优化以及 webpack 运行性能优化
    // development 模式:会将模块内的 process.env.NODE_ENV 的值设为 development。
    // 默认会开启 debug 工具，运行时打印详细的错误信息，以及更加快速的增量编译构建
    mode: 'development',
    devtool: 'source-map',
    entry: './src/index.js', // 设置入口文件 默认值是 ./src/index.js
    output: {
      path: path.resolve(__dirname, 'dist'), // 打包后文件路径 默认值 ./dist/main.js
      filename: 'main.js', // 打包后文件名
      // publicPath: '/lee', // 引用资源路径要加的前缀
    },
    // devServer 会启动一个 HTTP 开发服务器，把一个文件夹作为静态根目录
    // 为了提高性能，使用的内存文件系统
    // 默认情况下 devServer 会读取打包后的路径
    devServer: {
      writeToDisk: true, // 写入硬盘
      contentBase: path.resolve(__dirname, '/static'), // 额外的静态资源路径
      port: 8000,
      open: true,
      // publicPath:'/lee' // 打包生成的静态文件所在的位置，默认找 output 下的 publicPaht 值
    },
    module: {
      // webpack 只能识别js跟json文件 而loader的作用是让webpack可以处理其他类型的文件，并将他们转换为有效的模块，供程序使用，以及将该模块添加到依赖图中
      rules: [
        {
          test: /\.jsx?$/,
          loader: 'eslint-loader',
          enforce: 'pre',
          options: { fix: true },
          exclude: /node_modules/,
        },
        {
          test: /\.jsx?$/,
          use: {
            loader: 'babel-loader', // babel-loader 让 webpack 使用 Babel 转译 JavaScript 文件
            options: {
              presets: [
                [
                  '@babel/preset-env', // 预设 根据这个来决定怎么进行转换
                ],
                '@babel/preset-react', // React插件的Babel预设 JSX
              ],
              plugins: [
                ['@babel/plugin-proposal-decorators', { legacy: true }], // 把类和对象装饰器编译成ES5
                ['@babel/plugin-proposal-class-properties', { loose: true }], // 转换静态类属性以及使用属性初始值化语法声明的属性
              ],
            },
          },
        },
        { test: /\.css$/, use: ['style-loader', 'css-loader'] }, // 通过 loader 处理css文件 style-loader 处理样式把CSS插入DOM中 css-loader 处理css文件中的样式引入问题 @import和url()
        { test: /\.scss$/, use: ['style-loader', 'css-loader', 'sass-loader'] },
        { test: /\.less$/, use: ['style-loader', 'css-loader', 'less-loader'] },
        {
          test: /\.(jpg|png|gif|svg|bmp)$/, // file-loader 处理CSS等文件中的引入图片路径问题
          use: [
            {
              loader: 'url-loader', // url-loader 当图片小于limit的时候会把图片BASE64编码，大于limit参数的时候还是使用file-loader进行拷贝
              options: {
                esModule: false, // 不使用 esModule 模式进行导出
                name: '[hash:10].[ext]', // 引入的图片重新用hash命名
                limit: 8 * 1024,
              },
            },
          ],
        },
        {
          test: /\.html$/,
          use: [
            {
              loader: 'html-loader',
              options: {
                esModule: false,
              },
            },
          ], // html 中引入图片的处理
        },
      ],
    },
    // 插件的功能很强大，可以让webpack执行范围更广的任务，例如打包优化，资源管理，注入环境变量等待等。
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/index.html',
      }),
    ],
  };
};
