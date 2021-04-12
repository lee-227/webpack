const path = require('path')
const AssetPlugin = require('./demo/assets-plugin')
const ZipPlugin = require('./demo/zip-plugin')
const AutoExternalPlugin = require('./demo/AutoExternalPlugin')
module.exports = {
  entry: path.resolve(__dirname, './src'),
  mode: 'development',
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: '[name].js',
  },
  plugins: [
    new AssetPlugin(),
    new ZipPlugin({ filename: 'assets.zip' }),
    new AutoExternalPlugin({
      jquery: {
        expose: '$',
        url: 'https://cdn.bootcss.com/jquery/3.1.0/jquery.js',
      },
    }),
  ],
}
