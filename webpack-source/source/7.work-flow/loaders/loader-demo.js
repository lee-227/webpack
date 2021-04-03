function loaderDemo(source) {
  console.log('loader-demo执行');
  // source += '已转换';
  return source;
}
module.exports = loaderDemo;
