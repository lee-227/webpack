const webpack = require('webpack')
const path = require('path')
let compiler = webpack({
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.js',
    chunkFilename: '[name].lee.js'
  }
})
compiler.run((err, obj) => {
  console.log(err, obj)
})
