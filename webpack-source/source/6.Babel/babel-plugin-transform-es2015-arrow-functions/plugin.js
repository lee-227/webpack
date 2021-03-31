let types = require('babel-types');

// babel 插件就是一个对象，该对象拥有一个 visitor 访问器
module.exports = {
  // 访问器，不同插件实现不同的 visitor
  visitor: {
    // 属性就是节点的类型，babel在遍历到对应类型的节点的时候会调用此函数
    ArrowFunctionExpression(nodePath) {
      // nodePath 是节点的数据
      let node = nodePath.node;
      // 处理 this 指针问题
      hoistFunctionEnvironment(nodePath);
      // 修改了该节点类型之后 箭头函数 就会 变成 普通函数
      node.type = 'FunctionExpression';
    },
  },
};
function hoistFunctionEnvironment(fnPath) {
  // 向上查找 找到拥有 this 的函数
  const thisEnvFn = fnPath.findParent((p) => {
    return (p.isFunction() && !p.isArrowFunctionExpression) || p.isProgram();
  });
  //   const thisEnvFn = findParent(fnPath);
  // 找到所有使用过 this 的节点
  const thisPaths = getScopeInfoInformation(fnPath);
  let thisBinding = '_this'; // 把this变量重定向的变量名
  if (thisPaths.length > 0) {
    // 说明子节点使用过 this 此时就需要在刚刚找到的拥有 this 的函数上定义 _this 变量
    thisEnvFn.scope.push({
      id: types.identifier(thisBinding),
      init: types.thisExpression(),
    });
    // 遍历所有使用 this 的节点 将他们改为 _this
    thisPaths.forEach((thisChild) => {
      let thisRef = types.identifier(thisBinding);
      thisChild.replaceWith(thisRef);
    });
  }
}
function getScopeInfoInformation(fnPath) {
  let thisPaths = [];
  fnPath.traverse({
    ThisExpression(thisPath) {
      thisPaths.push(thisPath);
    },
  });
  return thisPaths;
}
function findParent(fnPath) {
  do {
    if ((p.isFunction() && !p.isArrowFunctionExpression) || p.isProgram())
      return fnPath;
  } while ((fnPath = fnPath.parentPath));
}
