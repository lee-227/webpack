//这样导入会导致引入库中的所有方法 应该转换成下方的导入方式，使用插件完成转换
import { isArray, isString } from 'lodash';

// import isArray from 'lodash/isArray';
// import isString from 'lodash/isString';

console.log(isArray([]));
console.log(isString([]));

/*
webpack config
module: {
    rules: [
      {
        test: /.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            plugins: [
              [
                'babel-plugin-import',
                {
                  libraryName: 'lodash',
                  libraryDirectory: '',
                  camel2DashComponentName: false, // default: true
                },
              ],
            ],
          },
        },
      },
    ],
  },
*/
