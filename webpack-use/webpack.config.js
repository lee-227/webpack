const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCssAssetsWebpackPlugin = require('optimize-css-assets-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
require('dotenv').config(); // 读取 env 文件，将文件内容添加到 process.env 上

console.log(process.env.LEE);
module.exports = (env, argv) => {
  console.log('env', env);
  console.log('argv', argv);

  return {
    // production 模式:会将模块内的 process.env.NODE_ENV 的值设为 production。
    // 默认会启用各种性能优化的功能，包括构建结果优化以及 webpack 运行性能优化
    // development 模式:会将模块内的 process.env.NODE_ENV 的值设为 development。
    // 默认会开启 debug 工具，运行时打印详细的错误信息，以及更加快速的增量编译构建
    mode: env.production ? 'production' : 'development',
    // devtool: 'source-map',
    // entry: './src/index.js', // 设置入口文件 默认值是 ./src/index.js
    entry: {
      main: './src/index.js',
    },
    output: {
      path: path.resolve(__dirname, 'dist'), // 打包后文件路径 默认值 ./dist/main.js
      filename: '[name].[hash:10].js', // 入口代码块的名称
      chunkFilename: '[name].[hash:10].js', // 非入口代码块的名称 两个来源 1.代码分割 common vendor 2.懒加载 import 导入的模块
      // filename: 'main.js', // 打包后文件名
      // publicPath: '/lee', // 引用资源路径要加的前缀
      // 不清楚具体路径时可以留空，然后再应用的入口文件设置__webpack_public_path__，实现在运行时进行动态设置
    },
    // devServer 会启动一个 HTTP 开发服务器，把一个文件夹作为静态根目录
    // 为了提高性能，使用的内存文件系统
    // 默认情况下 devServer 会读取打包后的路径
    devServer: {
      writeToDisk: true, // 写入硬盘
      contentBase: path.resolve(__dirname, '/static'), // 额外的静态资源路径
      port: 8000,
      open: true,
      compress: true, // 开启 gzip 压缩
      // publicPath:'/lee' // 打包生成的静态文件所在的位置，默认找 output 下的 publicPaht 值
      before: (app) => {
        // 本质上 devSever 启用的是 express 服务器 可以通过这个方法 mock 接口数据
        app.get('/api', (req, res) => res.end('data'));
      },
      // proxy: {
      //   // 接口代理
      //   '/api': {
      //     target: 'http://localhost:8080',
      //     pathRewrite: {
      //       '^/api': '',
      //     },
      //   },
      // },
    },
    watch: false, // 监听文件变化 自动重新打包 配合 webpack 命令使用 也可以通过 webpack --watch 开启监听
    watchOptions: {
      // 监听选项
      ignored: /node_modules/, // 忽略哪些文件
      aggregateTimeout: 300, // 文件发生变化后 过 300 ms重新编译
      poll: 1000, // 每秒钟访问1000次文件查看是否文件改变，数值越大越敏感
    },
    optimization: {
      minimize: env.production || false,
      minimizer: [new TerserPlugin(), new OptimizeCssAssetsWebpackPlugin()], // 优化和压缩JS资源的插件
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
        {
          test: /\.css$/,
          use: [
            'style-loader',
            'css-loader',
            {
              loader: 'px2rem-loader', // px 转 rem remUnit 根据设计稿宽度决定
              options: {
                remUnit: 75,
              },
            },
          ],
        },
        // 通过 loader 处理css文件 style-loader 处理样式把CSS插入DOM 中 css-loader 处理css文件中的样式引入问题 @import和url()
        {
          test: /\.scss$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            'postcss-loader', // css 兼容
            'sass-loader',
          ],
        },
        {
          test: /\.less$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            'postcss-loader',
            'less-loader',
          ],
        },
        {
          test: /\.(jpg|png|gif|svg|bmp)$/, // file-loader 处理CSS等文件中的引入图片路径问题
          use: [
            {
              loader: 'url-loader', // url-loader 当图片小于limit的时候会把图片BASE64编码，大于limit参数的时候还是使用file-loader进行拷贝
              options: {
                esModule: false, // 不使用 esModule 模式进行导出
                name: '[hash:10].[ext]', // 引入的图片重新用hash命名 也可以设置输出目录 跟 outputPath 配合 publicPath 一致 会导致重新打包删除 images 目录失败
                limit: 8 * 1024,
                outputPath: 'images', // 制定输出目录
                publicPath: '/images', // 输出目录修改时 引入的路径也要修改
              },
            },
            // {
            //   loader: 'image-webpack-loader',
            //   options: {
            //     mozjpeg: {
            //       progressive: true,
            //       quality: 65,
            //     },
            //     optipng: {
            //       enabled: false,
            //     },
            //     pngquant: {
            //       quality: '65-90',
            //       speed: 4,
            //     },
            //     gifsicle: {
            //       interlaced: false,
            //     },
            //     webp: {
            //       quality: 75,
            //     },
            //   },
            // },
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
        minify: {
          // 开启 HTML 压缩
          collapseWhitespace: true,
          removeComments: true,
        },
        // chunks: ['main'], // 可以指定 html 中插入哪些代码块的资源
      }),
      new CleanWebpackPlugin({
        cleanOnceBeforeBuildPatterns: ['**/*'],
      }),
      // 复制文件
      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, './src/static'),
            to: path.resolve(__dirname, './dist/static'),
          },
        ],
      }),
      new MiniCssExtractPlugin({
        filename: 'css/[name].css',
      }), // css 代码分割
      env.production && new OptimizeCssAssetsWebpackPlugin(), // 优化和压缩CSS资源的插件 一可以放到 optimization中
    ].filter(Boolean),
  };
};
