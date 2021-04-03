const { SyncHook } = require('tapable');
const path = require('path');
const fs = require('fs');
const types = require('babel-types');
const parser = require('@babel/parser'); // 源代码转成AST抽象语法树
const traverse = require('@babel/traverse').default; // 遍历语法树
const generator = require('@babel/generator').default; // 把语法树重新生成代码

// path.posix.sep 就是 / 而path.sep 是不同系统下的路径分隔符 / 或 \
// 为了保证统一，所以webpack通一采用'/'作为分隔符
function toUnixPath(path) {
  return path.replace(/\\/g, '/');
}
// 根据webpack配置的extensions 生成对应的模块的路径
function tryExtensions(
  modulePath,
  extensions,
  originalModulePath,
  moduleContext
) {
  for (let i = 0; i < extensions.length; i++) {
    if (fs.existsSync(modulePath + extensions[i])) {
      return modulePath + extensions[i];
    }
  }
  throw new Error(
    `Module not found: Error: Can't resolve '${originalModulePath}' in '${moduleContext}'`
  );
}
function getSource(chunk) {
  return `
   (() => {
    var modules = {
      ${chunk.modules
        .map(
          (module) => `
          "${module.id}": (module,exports,require) => {
            ${module._source}
          }`
        )
        .join(',')}
    };
    var cache = {};
    function require(moduleId) {
      if (cache[moduleId]) {
        return cache[moduleId].exports;
      }
      var module = (cache[moduleId] = {
        exports: {},
      });
      modules[moduleId](module, module.exports, require);
      return module.exports;
    }
    (() => {
     ${chunk.entryModule._source}
    })();
  })();
   `;
}
//根目录，当前工作目录
let baseDir = toUnixPath(process.cwd());
class Compiler {
  constructor(options) {
    this.options = options;
    this.hooks = {
      run: new SyncHook(),
      done: new SyncHook(),
      emit: new SyncHook(), // 最后生成文件前触发的钩子
    };
    this.modules = new Set(); // 存放所有的模块
    this.chunks = new Set(); // 存放所有的代码块
    this.entires = new Set(); // 存放所有的入口模块 跟chunks一致
    this.assets = {}; // 存放将要产出的资源文件
    this.files = new Set(); //表示本次编译的所有产出的文件名
  }
  // 4. 执行compiler对象的run方法开始编译
  run(callback) {
    // 所有注册了run钩子的回调函数会在此刻执行
    this.hooks.run.call();
    // 5. 找到entry入口文件，获取入口文件的绝对路径
    let entry = {};
    if (typeof this.options.entry === 'string') {
      entry.main = this.options.entry;
    } else {
      entry = this.options.entry;
    }
    for (const entryName in entry) {
      let entryFilePath = toUnixPath(
        path.resolve(this.options.context, entry[entryName])
      );
      // 6. 从入口文件出发，调用所有配置的loader对模块进行编译
      let entryModule = this.buildModule(entryName, entryFilePath);
      // 7. 根据入口模块跟依赖模块的依赖关系，组装成包含多个模块的代码块 chunk
      let chunk = {
        name: entryName,
        entryModule,
        modules: [...this.modules].filter((m) => m.name === entryName),
      };
      this.chunks.add(chunk);
      this.entires.add(chunk);
    }
    // 8. 将每个chunk转换成单独的文件 写入到文件系统
    this.chunks.forEach((chunk) => {
      // 根据output生成文件名
      let filename = this.options.output.filename.replace('[name]', chunk.name);
      this.assets[filename] = getSource(chunk);
    });
    this.hooks.emit.call();
    // 9. 确定好输出内容后，根据配置的output确定输出文件的路径跟文件名
    this.files.add(Object.keys(this.assets));
    for (const filename in this.assets) {
      let targetPath = path.join(this.options.output.path, filename);
      fs.writeFileSync(targetPath, this.assets[filename]);
    }
    this.hooks.done.call();
    callback(null, {
      //此对象stats 统计信息，表示本次编译结果的描述信息对象
      toJson: () => {
        return {
          entries: this.entries,
          chunks: this.chunks,
          modules: this.modules,
          files: this.files,
          assets: this.assets,
        };
      },
    });
  }
  /**
   * 编译模块
   * @param {*} modulePath
   */
  buildModule(name, modulePath) {
    // 获取原始代码
    let originalSourceCode = fs.readFileSync(modulePath, 'utf-8');
    let targetSourceCode = originalSourceCode;
    // 获取该模块对应的loader，进行代码转换
    let rules = this.options.module.rules;
    let loaders = [];
    for (const rule of rules) {
      // 通过配置的正则匹配模块
      if (rule.test.test(modulePath)) {
        loaders = [...loaders, ...rule.use];
      }
    }
    for (let i = loaders.length - 1; i >= 0; i--) {
      let loader = loaders[i];
      targetSourceCode = require(loader)(targetSourceCode);
    }
    // 计算模块ID 模块ID是当前模块基于根目录的相对路径
    let moduleId = './' + path.posix.relative(baseDir, modulePath);
    let module = {
      id: moduleId,
      dependencies: [],
      name,
    };
    // 找出该模块依赖的模块，递归本步骤 处理模块 通过ast进行处理
    // webpack 本身使用的acorn库进行的ast处理
    let astTree = parser.parse(targetSourceCode, { sourceType: 'module' });
    traverse(astTree, {
      CallExpression: ({ node }) => {
        if (node.callee.name === 'require') {
          // 将依赖模块的路径转为绝对路径
          let moduleName = node.arguments[0].value;
          // 获取当前模块的相对路径
          let dirname = path.posix.dirname(modulePath);
          // 当前模块相对路径 跟 依赖模块路径 拼成绝对路径 此时可能没有文件后缀
          let depModulePath = path.posix.join(dirname, moduleName);
          let extensions = this.options.resolve.extensions;
          // 如果没有文件后缀 需要根据webpack 配置的extensions添加后缀
          depModulePath = tryExtensions(
            depModulePath,
            extensions,
            moduleName,
            dirname
          );
          // 生成依赖模块的模块ID
          let depModuleId = './' + path.posix.relative(baseDir, depModulePath);
          // 修改ast 将引入的模块路经修改为模块ID
          node.arguments = [types.stringLiteral(depModuleId)];
          // 将该依赖模块 添加到当前模块的dependencies中
          module.dependencies.push(depModulePath);
        }
      },
    });
    // 根据新的ast生成新代码
    let { code } = generator(astTree);
    module._source = code; // 将转换后的代码保存到当前模块
    module.dependencies.forEach((dependency) => {
      let depModule = this.buildModule(name, dependency);
      this.modules.add(depModule);
    });
    return module;
  }
}
module.exports = Compiler;
