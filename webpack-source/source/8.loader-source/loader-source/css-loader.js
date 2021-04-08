let loaderUtils = require('loader-utils')
let postcss = require('postcss')
let Tokenizer = require('css-selector-tokenizer')

function loader(inputSource) {
  let loaderOptions = loaderUtils.getOptions(this) || {}
  let callback = this.async()
  const cssPlugin = (options) => {
    return (root) => {
      // 3. 遍历语法树 找到所有的import 删除该节点 将import导入的资源路径存入options.imports
      if (loaderOptions.import) {
        root.walkAtRules(/^import$/i, (rule) => {
          rule.remove()
          options.imports.push(rule.params.slice(1, -1))
        })
      }
      // 4. 遍历语法树 找到所有的url引入的文件 将其转换为 require(文件路径) webpack会处理改require依赖
      if (loaderOptions.url) {
        root.walkDecls(/^background-image/, (decl) => {
          let values = Tokenizer.parseValues(decl.value)
          values.nodes.forEach((node) => {
            node.nodes.forEach((item) => {
              if (item.type === 'url') {
                let url = loaderUtils.stringifyRequest(this, item.url)
                item.stringType = "'"
                item.url = '`+require(' + url + ')+`'
              }
            })
          })
          let value = Tokenizer.stringifyValues(values)
          decl.value = value
        })
      }
    }
  }
  let options = { imports: [] }
  // 1. 设置插件 遍历语法树时会执行该插件
  let pipeline = postcss([cssPlugin(options)])
  // 2. process 开始遍历语法树，执行对应的 cssPlugin
  pipeline.process(inputSource).then((result) => {
    // 5. 遍历完成后 根据配置的importLoaders 决定 import引入的css文件需要几个loader进行处理
    let { importLoaders = 0 } = loaderOptions
    let { loaders, loaderIndex } = this
    let loadersRequest = loaders
      .slice(loaderIndex, loaderIndex + 1 + importLoaders)
      .map((i) => i.request)
      .join('!')
    // 6. 生成依赖的css文件的请求路径
    // 7. 将最后的css文件内容转换成JS代码，将该文件的css代码存放到数组中，将该文件依赖的css文件通过require交由webpack进行引入
    let importCss = options.imports
      .map(
        (url) =>
          `list.push(...require(` +
          loaderUtils.stringifyRequest(this, `-!${loadersRequest}!${url}`) +
          `));`
      )
      .join('\r\n')
    // 8. 重写该数组的toString方法，将数组中存放到所有css代码转成字符串，交给style-loader进行处理
    let script = `
      var list = [];
      list.toString = function(){return this.join('')}
      ${importCss}
      list.push(\`${result.css}\`);
      module.exports = list;
   `
    callback(null, script)
  })
}
module.exports = loader
