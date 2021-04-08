const loaderUtils = require('loader-utils')
function loader(content) {
  // 处理正常的css代码时只需要将css代码插入到html头部即可
  return `
        let style = document.createElement('style');
        style.innerHTML = ${JSON.stringify(content)};
        document.head.appendChild(style);
    `
}
// 处理css-loader时要使用pitch 通过require获取到最终css-loader返回的数组，调用数组的toString获取到最终的css代码
loader.pitch = function (remainingRequest, previousRequest, data) {
  let style = `
   let style = document.createElement('style');
   style.innerHTML = require(${loaderUtils.stringifyRequest(
     this,
     '!!' + remainingRequest
   )}).toString();
   document.head.appendChild(style);
  `
  return style
}
module.exports = loader
