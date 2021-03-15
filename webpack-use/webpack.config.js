const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
module.exports = (env, argv) => {
  console.log('env', env)
  console.log('argv', argv)

  return {
    // production 模式:会将 process.env.NODE_ENV 的值设为 production。默认会启用各种性能优化的功能，包括构建结果优化以及 webpack 运行性能优化
    // development 模式:会将 process.env.NODE_ENV 的值设为 development。默认会开启 debug 工具，运行时打印详细的错误信息，以及更加快速的增量编译构建
    mode: 'development',
    entry: './src/index.js', // 设置入口文件
    output: {
      path: path.resolve(__dirname, 'dist'), // 打包后文件路径
      filename: 'main.js', // 打包后文件名
      // publicPath: '/lee', // 引用资源路径要加的前缀
    },
    devServer: {
      contentBase: path.resolve(__dirname, '/static'), // 额外的静态资源路径
      port: 8888,
      open: true,
    },
    module: {
      // webpack 只能识别js跟json文件 而loader的作用是让webpack可以处理其他类型的文件，并将他们转换为有效的模块，供程序使用，以及将该模块添加到依赖图中
      rules: [
        { test: /\.css$/, use: ['style-loader', 'css-loader'] }, //通过 loader 处理css文件 style-loader 处理样式 css-loader 处理css文件中的样式引入问题
        { test: /\.scss$/, use: ['style-loader', 'css-loader', 'sass-loader'] },
        { test: /\.less$/, use: ['style-loader', 'css-loader', 'less-loader'] },
        {
          test: /\.(jpg|png|gif|svg|bmp)$/, // file-loader 处理处理图片引入
          use: [
            {
              loader: 'url-loader', // 当图片小于limit的时候会把图片BASE64编码，大于limit参数的时候还是使用file-loader进行拷贝
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
          loader: 'html-loader', // html 中引入图片的处理
        },
      ],
    },
    //插件的功能很强大，可以让webpack执行范围更广的任务，例如打包优化，资源管理，注入环境变量等待等。
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/index.html',
      }),
    ],
  }
}
