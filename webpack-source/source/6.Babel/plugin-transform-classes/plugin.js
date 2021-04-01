let t = require('babel-types');

// babel 插件就是一个对象，该对象拥有一个 visitor 访问器
module.exports = {
  // 访问器，不同插件实现不同的 visitor
  visitor: {
    // 属性就是节点的类型，babel在遍历到对应类型的节点的时候会调用此函数
    ClassDeclaration: {
      enter(nodePath) {
        console.log('进入');
        // nodePath 是节点的数据
        let node = nodePath.node;
        let id = node.id;
        // 获取类中的所有方法 constructor 跟 普通方法
        let methods = node.body.body;
        let functions = [];
        methods.forEach((m) => {
          if (m.kind === 'constructor') {
            // 将构造函数变成普通函数
            constructorFunction = t.functionDeclaration(
              id,
              m.params,
              m.body,
              false,
              false
            );
            functions.push(constructorFunction);
          } else {
            // 将其他方法声明成类原型上的方法
            let memberObj = t.memberExpression(
              t.memberExpression(id, t.identifier('prototype')),
              m.key
            );
            let memberFunction = t.functionExpression(
              id,
              m.params,
              m.body,
              false,
              false
            );
            let assignment = t.assignmentExpression(
              '=',
              memberObj,
              memberFunction
            );
            functions.push(assignment);
          }
        });
        if (functions.length == 0) {
          nodePath.replaceWith(constructorFunction);
        } else if (functions.length == 1) {
          nodePath.replaceWith(functions[0]);
        } else {
          nodePath.replaceWithMultiple(functions);
        }
      },
      exit(nodePath) {
        console.log('离开');
      },
    },
  },
};
