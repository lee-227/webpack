var hotEmitter = require('./emitter');
hotEmitter.on('webpackHotUpdate', (currentHash) => {
  console.log('dev-server收到了最新的hash值', currentHash);
});
