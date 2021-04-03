const RunPlugin = require('./plugins/run-plugin');
const DonePlugin = require('./plugins/done-plugin');
const ReadmePlugin = require('./plugins/readme-plugin');
const path = require('path');
module.exports = {
  mode: 'development',
  context: process.cwd(), //根目录 current working directory
  entry: path.resolve(__dirname, 'src/index.js'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
  },
  module: {
    rules: [
      {
        test: /.js$/,
        use: [path.resolve(__dirname, 'loaders/loader-demo.js')],
      },
    ],
  },
  plugins: [new RunPlugin(), new DonePlugin(), new ReadmePlugin()],
};
