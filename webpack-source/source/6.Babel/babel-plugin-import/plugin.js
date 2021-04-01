const t = require('babel-types');
module.exports = () => {
  return {
    visitor: {
      ImportDeclaration(path, state = { opts: {} }) {
        opts = state.opts;
        let node = path.node;
        if (
          node.source.value === opts.libraryName &&
          !t.isImportDefaultSpecifier(node.specifiers[0])
        ) {
          let specifiers = node.specifiers;
          let ImportDeclarations = specifiers.map((s) => {
            return t.importDeclaration(
              [t.importDefaultSpecifier(s.local)],
              t.stringLiteral(
                `${opts.libraryName}${
                  opts.libraryDirectory ? '/' + opts.libraryDirectory : ''
                }/${s.imported.name}`
              )
            );
          });
          path.replaceWithMultiple(ImportDeclarations);
        }
      },
    },
  };
};
