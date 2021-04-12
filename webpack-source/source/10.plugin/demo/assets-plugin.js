class AssetPlugin {
  constructor(options) {
    this.options = options;
  }
  apply(compiler) {
    compiler.hooks.compilation.tap("AssetPlugin", function (compilation) {
      compilation.hooks.chunkAsset.tap("AssetPlugin", function (
        chunk,
        filename
      ) {
        console.log("filename=", filename);
      });
    });
  }
}
module.exports = AssetPlugin;