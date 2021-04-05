const { getOptions } = require('loader-utils');
const mime = require('mime');

function loader(content) {
  let { limit = 16 * 1024, fallback = 'file-loader' } = getOptions(this) || {};
  if (content.length < limit) {
    let base64Str = `data:${mime.getType(
      this.resourcePath
    )};base64,${content.toString('base64')}`;
    return `module.exports = "${base64Str}"`;
  } else {
    let fileLoader = require(fallback);
    return fileLoader.call(this, content);
  }
}
loader.raw = true;
module.exports = loader;
