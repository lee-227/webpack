const { merge } = require('webpack-merge');
const base = require('./webpack.base');

const devConfig = {
  mode: 'development',
};
module.exports = merge(base, devConfig);
