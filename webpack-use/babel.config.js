module.exports = {
  presets: [
    '@babel/preset-env', // 预设 根据这个来决定怎么进行转换
    '@babel/preset-react', // React插件的Babel预设 JSX
  ],
  plugins: [
    ['@babel/plugin-proposal-decorators', { legacy: true }], // 把类和对象装饰器编译成ES5
  ],
};
