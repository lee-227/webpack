let core = require('@babel/core');
let BabelPluginTransformClasses = require('./plugin');
// let BabelPluginTransformClasses = require('@babel/plugin-transform-classes');

const sourceCode = `
class Person {
    constructor(name) {
        this.name=name;
    }
    getName() {
        return this.name;
    }
}
`;

let targetCode = core.transform(sourceCode, {
  plugins: [BabelPluginTransformClasses],
});

console.log(targetCode.code);
/*
function Person(name) {
  this.name = name;
}
Person.prototype.getName = function () {
  return this.name;
};
*/
