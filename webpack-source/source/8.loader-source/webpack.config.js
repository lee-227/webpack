const path = require('path')
module.exports = {
  mode: 'development',
  entry: path.resolve(__dirname, './src/index.js'),
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: '[name].js',
  },
  devtool: 'inline-source-map',
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
  },
  // 如何配置查找自己写的loader
  // resolveLoader: {
  //   alias: {
  //     'babel-loader': path.resolve('./loader-source/babel-loader.js'),
  //   },
  //   modules: [path.resolve('./loader-source')],
  // },
  module: {
    rules: [
      {
        test: /.js$/,
        use: [path.resolve(__dirname, './loader-source/babel-loader.js')],
        include: path.resolve(__dirname, './src'),
      },
      {
        test: /\.(jpg|png|gif)$/,
        use: [
          {
            loader: path.resolve(__dirname, './loader-source/url-loader.js'),
            options: {
              name: '[hash:8].[ext]',
              esModule:false,
              fallback: path.resolve(
                __dirname,
                './loader-source/file-loader.js'
              ),
            },
          },
        ],
      },
      {
        test: /.less$/,
        use: [
          path.resolve(__dirname, './loader-source/style-loader.js'),
          {
            loader: path.resolve(__dirname, './loader-source/css-loader.js'),
            options: {
              url: true, //是否解析url()
              import: true, //是否解析@import语法
              esModule: false, //不包装成ES MODULE，默认是common.js导出
              importLoaders: 0, //在处理导入的CSS的时候，要经过几个前置loader的处理
            },
          },
          path.resolve(__dirname, './loader-source/less-loader.js'),
        ],
      },
    ],
  },
}
