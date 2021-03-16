module.exports = {
  parser: 'babel-eslint',
  extends: 'airbnb',
  // 指定脚本的运行环境
  env: {
    browser: true,
    node: true,
  },
  // 启用的规则及其各自的错误级别
  rules: {
    'linebreak-style': ['off', 'windows'],
    'no-console': 'off', // 禁止使用console
  },
};
