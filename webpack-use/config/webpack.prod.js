const { merge } = require('webpack-merge');
const base = require('./webpack.base');

const prodConfig = {
  mode: 'production',
};
module.exports = merge(base, prodConfig);
