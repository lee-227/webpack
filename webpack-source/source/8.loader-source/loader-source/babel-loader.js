const core = require('@babel/core');
const path = require('path');

/**
 * @param {*} source 上一个loader给我这个loader的内容或者最原始模块内容
 * @param {*} inputSourceMap 上一个loader传递过来的sourceMap
 * @param {*} data  本loader额外的数据
 */
function loader(source, inputSourceMap, data) {
  // this === loaderContext
  console.log(this.data);
  const options = {
    presets: ['@babel/preset-env'],
    inputSourceMap,
    sourceMap: true,
    filename: path.basename(this.resourcePath),
  };
  let { code, map, ast } = core.transform(source, options);
  this.callback(null, code, map, ast);
}
loader.pitch = function (remainingRequest, previousRequest, data) {
  data.name = 'lee';
};
module.exports = loader;
// 当你需要返回多值的时候需要使用 this.callback来传递多个值
// 只需要返回一个值,可以直接 return
