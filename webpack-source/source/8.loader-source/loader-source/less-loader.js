const less = require('less');
function loader(content) {
  // 调用this.async方法可以返回一个函数，它会把loader的执行变成异步的,不会直接往下执行了
  let callback = this.async();
  less.render(content, { filename: this.resource }, (err, output) => {
    callback(err, output.css);
  });
}
module.exports = loader;
