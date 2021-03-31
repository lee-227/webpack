let core = require('@babel/core');
let BabelPluginTransformEs2015ArrowFunctions = require('./plugin');
// let BabelPluginTransformEs2015ArrowFunctions = require('babel-plugin-transform-es2015-arrow-functions');

const sourceCode = `
const sum = (a,b)=>{
    console.log(this);
    return a+b;
}
`;

let targetCode = core.transform(sourceCode, {
  plugins: [BabelPluginTransformEs2015ArrowFunctions],
});

console.log(targetCode.code);
/*
var _this = this;

const sum = function (a, b) {
  console.log(_this);
  return a + b;
};
*/
