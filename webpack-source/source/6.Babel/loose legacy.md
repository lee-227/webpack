# Babel loose mode
官方警告: Babel 的 loose 模式会将 ES6 代码转换为不太忠实于 ES6 语义的 ES5 代码。

## Two modes
Babel 的许多插件都有两种运行模式

1. normal mode 会尽可能的遵循 ECMAScript6 的语义
2. loose mode 则会产生更简单的类似于手写的 ES5 代码, 并不会严格遵循 ES6 语义

正常情况下, 不推荐使用 loose 模式

## 官方示例
babel-plugin-transform-es2015-classes
```js
class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    toString() {
        return `(${this.x}, ${this.y})`;
    }
}
```
```js
// loose mode
function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

let Point = function () {
    function Point(x, y) {
        _classCallCheck(this, Point);

        this.x = x;
        this.y = y;
    }
    // 直接在原型对象添加对应的方法, 没有严格考虑 ES6 类中方法的定义
    // 比如类的方法都是不可枚举的, 而在 loose 模式中直接忽略了这一规定
    Point.prototype.toString = function toString() {
        return `(${this.x}, ${this.y})`;
    };

    return Point;
}();
```
```js
// normal mode
var _createClass = function () {
    // 按照 ES6 语义添加了更多的限制, 更符合 ES6 语法规定
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            // 设置 可枚举 性
            descriptor.enumerable = descriptor.enumerable || false;
            // 设置 可配置 性
            descriptor.configurable = true;
            // 设置 可修改 性
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
        }
    }
    return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);
        if (staticProps) defineProperties(Constructor, staticProps);
        return Constructor;
    };
}();

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

let Point = function () {
    function Point(x, y) {
        _classCallCheck(this, Point);

        this.x = x;
        this.y = y;
    }

    _createClass(Point, [{
        key: "toString",
        value: function toString() {
            return `(${this.x}, ${this.y})`;
        }
    }]);

    return Point;
}();
```
## 两种模式下的示例
以我们最常用的 @babel/preset-env 预设所包含的插件为例
1. [@babel/plugin-transform-spread](https://babeljs.io/docs/en/babel-plugin-transform-spread)
    - In loose mode, all iterables are assumed to be arrays.
    - **loose 模式下 所有的可迭代对象都被假定为数组**
```js
// 该插件处理 ... 语法
const a = [...new Set([1, 2, 3, 1]), 4]
console.log(a); // [ 1, 2, 3, 4 ]
```
```js
// loose mode
// 直接将 new Set() 当做数组处理, 导致代码执行结果与期望值不同
const a = [].concat(new Set([1, 2, 3, 1]), [4]);
console.log(a); // [ Set(3) { 1, 2, 3 }, 4 ]
```
```js
// normal mode
function _toConsumableArray(arr) {
    return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
}

function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

function _unsupportedIterableToArray(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(o);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}

function _iterableToArray(iter) {
    if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
}

function _arrayWithoutHoles(arr) {
    if (Array.isArray(arr)) return _arrayLikeToArray(arr);
}

function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
    return arr2;
}
// 将可迭代对象通过层层严格的判断进行处理, 确保代码的预期执行
const a = [].concat(_toConsumableArray(new Set([1, 2, 3, 1])), [4]);
console.log(a); // [ 1, 2, 3, 4 ]

2. 
```

2. [@babel/plugin-transform-for-of](https://babeljs.io/docs/en/babel-plugin-transform-for-of#loose)
    - In loose mode, arrays are put in a fast path, thus heavily increasing performance.
    - **loose 模式下 数组被放置在快速路径上, 因此大大提高了性能**
```js
for (var i of foo) {}
```
```js
// loose mode
// 直接采用 ES6 提供的 Symbol.iterator 遍历器进行遍历
// 不存在就创建一个遍历器方法进行遍历 等同于原生的 for of 遍历
// 因为 for of 本身就是靠 这个遍历器进行数据遍历的
function _createForOfIteratorHelperLoose(o, allowArrayLike) {
    var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];
    if (it) return (it = it.call(o)).next.bind(it);
    if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {
        if (it) o = it;
        var i = 0;
        return function () {
            if (i >= o.length) return {
                done: true
            };
            return {
                done: false,
                value: o[i++]
            };
        };
    }
    throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

function _unsupportedIterableToArray(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(o);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}

function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
    return arr2;
}
// 使用 for 循环代替 for of
for (var _iterator = _createForOfIteratorHelperLoose(foo), _step; !(_step = _iterator()).done;) {
    var i = _step.value;
}
```
```js
// normal mode 
// 在遍历器的基础上添加了额外包装了一个对象
// 添加了错误处理 更严格更规范的代码执行方式
function _createForOfIteratorHelper(o, allowArrayLike) {
    var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];
    if (!it) {
        if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {
            if (it) o = it;
            var i = 0;
            var F = function () {};
            return {
                s: F,
                n: function () {
                    if (i >= o.length) return {
                        done: true
                    };
                    return {
                        done: false,
                        value: o[i++]
                    };
                },
                e: function (e) {
                    throw e;
                },
                f: F
            };
        }
        throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    var normalCompletion = true,
        didErr = false,
        err;
    return {
        s: function () {
            it = it.call(o);
        },
        n: function () {
            var step = it.next();
            normalCompletion = step.done;
            return step;
        },
        e: function (e) {
            didErr = true;
            err = e;
        },
        f: function () {
            try {
                if (!normalCompletion && it.return != null) it.return();
            } finally {
                if (didErr) throw err;
            }
        }
    };
}

function _unsupportedIterableToArray(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(o);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}

function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
    return arr2;
}

var _iterator = _createForOfIteratorHelper(foo),
    _step;

try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var i = _step.value;
    }
} catch (err) {
    _iterator.e(err);
} finally {
    _iterator.f();
}
```

## 总结
- 优点: loose 模式, 生成代码速度更快, 代码体积更小, 更兼容旧引擎, 更接近 ES5 代码风格
- 缺点: 当从转义的 ES6 切换到原生 ES6 时会有某种风险

## 使用场景
1. 在你明确知道你所使用的 babel 插件在 loose 下的限制时, 可以开启该模式, 已体现出 loose 模式的优势
2. 但是大多项目我们会直接使用 @babel/preset-env 预设来进行代码转义, 该预设下包含了特别多的插件, 我们对这些插件的了解不多, 深入学习性价比不高, 所以不建议
开始该预设的 loose 模式, 以避免某些插件在 loose 模式下转义后的代码不符合代码的运行预期, 导致出现 bug

## 参考资料: 
- https://2ality.com/2015/12/babel6-loose-mode.html
- [@babel/preset-env 包含的插件](https://github.com/babel/babel/blob/main/packages/babel-preset-env/src/available-plugins.ts)

# Babel legacy
## legacy 
- Use the legacy (stage 1) decorators syntax and behavior.
- 使用历史(阶段1)装饰器语法和行为。
- 这个选项主要是用于 [@babel/plugin-proposal-decorators](https://babeljs.io/docs/en/babel-plugin-proposal-decorators#legacy) 插件 

## 官方介绍
- @babel/plugin-proposal-decorators 作用
    - 转义项目中使用的装饰器语法

- 使用 @babel/plugin-proposal-decorators 注意事项
1. 最新版本下 当使用 legacy: true 模式时，必须启用设置的  setPublicClassFields 来支持 @babel/plugin-proposal-decorator。
```js
{
  "assumptions": {
    "setPublicClassFields": true
  },
  "plugins": [
    ["@babel/plugin-proposal-decorators", { "legacy": true }],
    ["@babel/plugin-proposal-class-properties"]
  ]
}
```

## legacy 开启与不开启的区别
- 根据 Babel 提供的资料(https://babeljs.io/blog/2018/09/17/decorators), 装饰器这一提案不断的在经历变动, 其中有一次破环性较大的改动, 为了兼容旧的提案, Babel 在 7.0.0 中为 @babel/plugin-proposal-decorators 插件引入了 legacy 标识, 其有效值为 true, 通过该标识来确定 Babel 进行转义时使用最新的提案还是旧提案. 
- legacy: true 使用旧提案
- legacy: false 使用新提案

## 新旧提案不兼容差异
1. 表达式差异

旧提案允许任何有效的左表达式（字面量，函数，类表达式，new 表达式以及函数调用等）用作装饰器主体。有效代码如下所示：
```js
function getDecorators() {
  return {
    methods(){}
  }
}
class MyClass {
  // legacy: false 可正常转义
  // legacy: true 报错, 新提案不允许这种表达式
  @getDecorators().methods
  foo() {}
}
```
新提案只允许通过点属性访问（foo.bar）可以选择在参数末尾使用（foo.bar()）。如果需要使用很复杂的表达式，可以将它们包裹在括号内
```js
class MyClass {
  @decorator
  @dec(arg1, arg2)
  @namespace.decorator
  @(complex ? dec1 : dec2)
  method() {}
}
```

2. 对象装饰器

旧提案允许除类和类元素装饰器以外的对象成员使用装饰器：
```js
const myObj = {
  @dec1 foo: 3,
  @dec2 bar() {},
};
// legacy: false 情况下 转义时会抛出错误 -> Decorators cannot be used to decorate object literal properties
// 当然 这种书写方法在编辑器中就会报错 已经被废弃掉了
```
由于与当前对象字面量语义的某些不兼容性，它们已从提案中被移除。

3. 装饰器函数相关参数

在旧提案中，类元素装饰器接收的参数分别为目标类（或对象），key 以及属性描述符 - 与传递给 Object.defineProperty 的形式类似。类装饰器将目标构造函数（constructor）作为唯一参数。

新的装饰器提案更加强大：元素装饰器会接收一个对象，该对象除更改属性描述符外，还允许更改 key 值，可以赋值（static，prototype 或者 own），以及元素的类型（field 或 method）。它们还可以创建其他属性并在装饰类上定义运行函数（完成器）。

## 参考资料
- [@babel/plugin-proposal-decorators legacy 介绍](https://babeljs.io/docs/en/babel-plugin-proposal-decorators#legacy)
- [decorators legacy](https://babeljs.io/blog/2018/09/17/decorators)
- [decorators legacy(中文)](https://juejin.cn/post/6844903758283948045)
- [装饰器提案](https://github.com/tc39/proposal-decorators)