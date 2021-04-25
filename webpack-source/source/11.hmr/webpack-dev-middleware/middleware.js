/**
 * 这个express中间件负责提供产出文件的预览
 * 拦截HTTP请求，看看请求的文件是不是webpack打包出来的文件。
 * 如果是的话，从硬盘上读出来，返回给客户端
 */
let mime = require('mime');
let path = require('path');
function wrapper({ fs, outputPath }) {
  return (req, res, next) => {
    let url = req.url;
    if (req.url === '/favicon.ico') return res.sendStatus(404);
    if (url === '/') url = '/index.html';
    let filename = path.join(outputPath, url);
    try {
      let stat = fs.statSync(filename);
      if (stat.isFile()) {
        let content = fs.readFileSync(filename);
        res.setHeader(
          'Content-Type',
          mime.getType(filename) + ';charset=utf-8'
        );
        return res.send(content);
      } else {
        return res.sendStatus(404);
      }
    } catch (error) {
      console.log(error);
      return next(error);
    }
  };
}

module.exports = wrapper;
