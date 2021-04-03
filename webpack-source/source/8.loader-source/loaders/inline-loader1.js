function normal(source) {
  console.log(this.context); // loaderContext
  console.log('inline1');
  return source + '//inline1';
}
normal.pitch = function (remainingRequest, previousRequest, data) {
  console.log('inline1-pitch');
};
normal.raw = false;
module.exports = normal;
