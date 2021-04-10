const { getOptions, interpolateName } = require('loader-utils');
// file-loader 负责打包加载图片
// 原理就是把此文件内容拷贝到目标目录里
function loader(content) {
  let options = getOptions(this) || {};
  let fileName = interpolateName(this, options.name, { content });
  this.emitFile(fileName, content); // 向输出目录里多写一个文件 文件名叫fileName，内容
  if (typeof options.esModule === 'undefined' || options.esModule) {
    return `export default "${fileName}"`; //es modules
  } else {
    return `module.exports="${fileName}"`; //commonjs
  }
}
loader.raw = true;
module.exports = loader;