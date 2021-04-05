let fs = require('fs');
let path = require('path');
let readFile = fs.readFile.bind(this);

function createLoaderObject(request) {
  let loaderObj = {
    request,
    normal: null, // loader 函数
    pitch: null, // loader 的 pitch 函数
    raw: false, // 是否将 loader 接受的内容转成 buffer
    data: {}, // 每个 loader 携带的数据
    pitchExecuted: false, // 是否执行过 pitch 函数
    normalExecuted: false, // 是否执行过 normal 函数
  };
  let normal = require(loaderObj.request); // 获取 loader 内容 进行初始化
  loaderObj.normal = normal;
  loaderObj.raw = normal.raw;
  loaderObj.pitch = normal.pitch;
  return loaderObj;
}
function runSyncOrAsync(fn, context, args, callback) {
  let isSync = true; //是否同步，默认是的
  let isDone = false; //是否fn已经执行完成,默认是false
  const innerCallback = (context.callback = function (err, ...values) {
    isDone = true;
    isSync = false;
    callback(err, ...values);
  });
  context.async = function () {
    isSync = false; //把同步标志设置为false,意思就是改为异步
    return innerCallback;
  };
  let result = fn.apply(context, args);
  if (isSync) {
    isDone = true; //直接完成
    return callback(null, result); //调用回调
  }
}
function iteratePitchingLoaders(processOptions, loaderContext, finalCallback) {
  // 下标超界限时说明 pitch 函数执行完毕，接下来需要读取文件供 loader 使用
  if (loaderContext.loaderIndex >= loaderContext.loaders.length) {
    return processResource(processOptions, loaderContext, finalCallback);
  }
  // 获取到当前loader
  let currentLoaderObject = loaderContext.loaders[loaderContext.loaderIndex];
  // 该loader的pitch函数已经执行过就往后继续执行
  if (currentLoaderObject.pitchExecuted === true) {
    loaderContext.loaderIndex++;
    return iteratePitchingLoaders(processOptions, loaderContext, finalCallback);
  }
  // 获取loader 的 pitch 函数执行
  let pitchFunction = currentLoaderObject.pitch;
  currentLoaderObject.pitchExecuted = true;
  if (!pitchFunction)
    return iteratePitchingLoaders(processOptions, loaderContext, finalCallback);
  runSyncOrAsync(
    pitchFunction,
    loaderContext,
    [
      loaderContext.remainingRequest,
      loaderContext.previousRequest,
      loaderContext.data,
    ],
    (err, ...values) => {
      if (values.length > 0 && !!values[0]) {
        // 如果pitch函数有返回值 则终止后续loader执行，获取到前一个loader 向前执行
        loaderContext.loaderIndex--;
        iterateNormalLoaders(
          processOptions,
          loaderContext,
          values,
          finalCallback
        );
      } else {
        iteratePitchingLoaders(processOptions, loaderContext, finalCallback);
      }
    }
  );
}
function processResource(processOptions, loaderContext, finalCallback) {
  loaderContext.loaderIndex = loaderContext.loaderIndex - 1; // 将索引置为最后一个loader的索引
  let resource = loaderContext.resource;
  // 读取文件内容 开始向前执行loader
  loaderContext.readResource(resource, (err, resourceBuffer) => {
    if (err) finalCallback(err);
    processOptions.resourceBuffer = resourceBuffer; //放的是资源的原始内容
    iterateNormalLoaders(
      processOptions,
      loaderContext,
      [resourceBuffer],
      finalCallback
    );
  });
}
function iterateNormalLoaders(
  processOptions,
  loaderContext,
  args,
  finalCallback
) {
  if (loaderContext.loaderIndex < 0) {
    // 如果索引已经小于0了，就表示所有的normal执行完成了
    return finalCallback(null, args);
  }
  let currentLoaderObject = loaderContext.loaders[loaderContext.loaderIndex];
  // 该loader已经执行过 继续向前迭代
  if (currentLoaderObject.normalExecuted) {
    loaderContext.loaderIndex--;
    return iterateNormalLoaders(
      processOptions,
      loaderContext,
      args,
      finalCallback
    );
  }
  let normalFunction = currentLoaderObject.normal;
  currentLoaderObject.normalExecuted = true; //表示pitch函数已经执行过了
  // 需要通过loader的raw属性进行loader内容的格式转换
  convertArgs(args, currentLoaderObject.raw);
  runSyncOrAsync(normalFunction, loaderContext, args, (err, ...values) => {
    if (err) finalCallback(err);
    iterateNormalLoaders(processOptions, loaderContext, values, finalCallback);
  });
}
function convertArgs(args, raw) {
  if (raw && !Buffer.isBuffer(args[0])) {
    //想要Buffer,但不是Buffer,转成Buffer
    args[0] = Buffer.from(args[0]);
  } else if (!raw && Buffer.isBuffer(args[0])) {
    //想要String,但不是String,转成String
    args[0] = args[0].toString('utf8');
  }
}
// 主执行函数 进行初始化
function runLoaders(options, callback) {
  let resource = options.resource || ''; //要加载的资源
  let loaders = options.loaders || []; //loader绝对路径的数组
  let loaderContext = options.context || {}; //这个是一个对象，它将会成为loader函数执行时候的上下文对象this
  let readResource = options.readResource || readFile; //读取硬盘上文件的默认方法
  let loaderObjects = loaders.map(createLoaderObject); // 将绝对路径转换成对应的loader loader的初始化
  loaderContext.resource = resource;
  loaderContext.readResource = readResource;
  loaderContext.loaderIndex = 0; //它是一个指针，就是通过修改它来控制当前在执行哪个loader
  loaderContext.loaders = loaderObjects; //存放着所有的loaders
  loaderContext.callback = null;
  loaderContext.async = null; //它是一个函数，可以把loader的执行从同步改为异步
  Object.defineProperty(loaderContext, 'request', {
    // 该文件的request
    get() {
      return loaderContext.loaders
        .map((l) => l.request)
        .concat(loaderContext.resource)
        .join('!');
    },
  });
  // 剩余 loader
  Object.defineProperty(loaderContext, 'remainingRequest', {
    get() {
      return loaderContext.loaders
        .slice(loaderContext.loaderIndex + 1)
        .concat(loaderContext.resource)
        .join('!');
    },
  });
  // 当前执行的 loader
  Object.defineProperty(loaderContext, 'currentRequest', {
    get() {
      return loaderContext.loaders
        .slice(loaderContext.loaderIndex)
        .concat(loaderContext.resource)
        .join('!');
    },
  });
  // 已经执行过的 loader
  Object.defineProperty(loaderContext, 'previousRequest', {
    get() {
      return loaderContext.loaders
        .slice(0, loaderContext.loaderIndex)
        .join('!');
    },
  });
  // 每个loader 的 data
  Object.defineProperty(loaderContext, 'data', {
    get() {
      let loaderObj = loaderContext.loaders[loaderContext.loaderIndex];
      return loaderObj.data;
    },
  });
  let processOptions = {
    resourceBuffer: null,
  };
  // 开始遍历loader 先执行 pitch 函数
  iteratePitchingLoaders(processOptions, loaderContext, (err, result) => {
    callback(err, {
      result,
      resourceBuffer: processOptions.resourceBuffer,
    });
  });
}

exports.runLoaders = runLoaders;
