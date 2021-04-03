// 1. 引入核心模块
const webpack = require('./webpack');
// 2. 获取配置参数
const webpackOptions = require('./webpack.config');
// 3. 执行wenpack 传入参数 获取 Compiler 对象，webpack 的核心对象
const compiler = webpack(webpackOptions);
// 4. 调用run方法开始执行编译
compiler.run((err, stats) => {
  // 5. 编译完成后执行该回调函数
  console.log(err); // 编译产生的错误信息
  console.log(
    stats.toJson({
      // stats 是编译结果的描述对象
      assets: true, // 产出的资源 [main.js]
      chunks: true, // 代码块 [main]
      modules: true, // 模块 ['./src/index.js','./src/title.js']
      entries: true, // 入口 entrypoints [./src/index.js]
    })
  );
});

/**
{
  "hash": "c43bd09690eeaa1dd5af",
  "version": "5.9.0",
  "time": 143,
  "builtAt": 1607088048384,
  "publicPath": "auto",
  "outputPath": "c:\\aproject\\zhufengwebpack202011\\5.flow\\dist",
  "assetsByChunkName": {
    "main": [
      "main.js"
    ]
  },
  "assets": [
    {
      "type": "asset",
      "name": "main.js",
      "size": 2332,
      "chunkNames": [
        "main"
      ],
      "chunkIdHints": [],
      "auxiliaryChunkNames": [],
      "auxiliaryChunkIdHints": [],
      "emitted": false,
      "comparedForEmit": true,
      "cached": false,
      "info": {
        "javascriptModule": false,
        "size": 2332
      },
      "related": {},
      "chunks": [
        "main"
      ],
      "auxiliaryChunks": [],
      "isOverSizeLimit": false
    }
  ],
  "chunks": [
    {
      "rendered": true,
      "initial": true,
      "entry": true,
      "recorded": false,
      "size": 44,
      "sizes": {
        "javascript": 44
      },
      "names": [
        "main"
      ],
      "idHints": [],
      "runtime": [
        "main"
      ],
      "files": [
        "main.js"
      ],
      "auxiliaryFiles": [],
      "hash": "00d4b1f2f74db1954796",
      "childrenByOrder": {},
      "id": "main",
      "siblings": [],
      "parents": [],
      "children": [],
      "origins": [
        {
          "module": "",
          "moduleIdentifier": "",
          "moduleName": "",
          "loc": "main",
          "request": "./src/index.js"
        }
      ]
    }
  ],
  "modules": [
    {
      "type": "module",
      "moduleType": "javascript/auto",
      "identifier": "c:\\aproject\\zhufengwebpack202011\\5.flow\\src\\index.js",
      "name": "./src/index.js",
      "nameForCondition": "c:\\aproject\\zhufengwebpack202011\\5.flow\\src\\index.js",
      "index": 0,
      "preOrderIndex": 0,
      "index2": 1,
      "postOrderIndex": 1,
      "size": 19,
      "sizes": {
        "javascript": 19
      },
      "cacheable": true,
      "built": true,
      "codeGenerated": true,
      "cached": false,
      "optional": false,
      "orphan": false,
      "issuer": null,
      "issuerName": null,
      "issuerPath": null,
      "failed": false,
      "errors": 0,
      "warnings": 0,
      "id": "./src/index.js",
      "issuerId": null,
      "chunks": [
        "main"
      ],
      "assets": [],
      "reasons": [
        {
          "moduleIdentifier": null,
          "module": null,
          "moduleName": null,
          "resolvedModuleIdentifier": null,
          "resolvedModule": null,
          "type": "entry",
          "active": true,
          "explanation": "",
          "userRequest": "./src/index.js",
          "loc": "main",
          "moduleId": null,
          "resolvedModuleId": null
        }
      ],
      "usedExports": null,
      "providedExports": null,
      "optimizationBailout": [],
      "depth": 0
    },
    {
      "type": "module",
      "moduleType": "javascript/auto",
      "identifier": "c:\\aproject\\zhufengwebpack202011\\5.flow\\src\\title.js",
      "name": "./src/title.js",
      "nameForCondition": "c:\\aproject\\zhufengwebpack202011\\5.flow\\src\\title.js",
      "index": 1,
      "preOrderIndex": 1,
      "index2": 0,
      "postOrderIndex": 0,
      "size": 25,
      "sizes": {
        "javascript": 25
      },
      "cacheable": true,
      "built": true,
      "codeGenerated": true,
      "cached": false,
      "optional": false,
      "orphan": false,
      "issuer": "c:\\aproject\\zhufengwebpack202011\\5.flow\\src\\index.js",
      "issuerName": "./src/index.js",
      "issuerPath": [
        {
          "identifier": "c:\\aproject\\zhufengwebpack202011\\5.flow\\src\\index.js",
          "name": "./src/index.js",
          "id": "./src/index.js"
        }
      ],
      "failed": false,
      "errors": 0,
      "warnings": 0,
      "id": "./src/title.js",
      "issuerId": "./src/index.js",
      "chunks": [
        "main"
      ],
      "assets": [],
      "reasons": [
        {
          "moduleIdentifier": "c:\\aproject\\zhufengwebpack202011\\5.flow\\src\\index.js",
          "module": "./src/index.js",
          "moduleName": "./src/index.js",
          "resolvedModuleIdentifier": "c:\\aproject\\zhufengwebpack202011\\5.flow\\src\\index.js",
          "resolvedModule": "./src/index.js",
          "type": "cjs require",
          "active": true,
          "explanation": "",
          "userRequest": "./title",
          "loc": "1:0-18",
          "moduleId": "./src/index.js",
          "resolvedModuleId": "./src/index.js"
        },
        {
          "moduleIdentifier": "c:\\aproject\\zhufengwebpack202011\\5.flow\\src\\title.js",
          "module": "./src/title.js",
          "moduleName": "./src/title.js",
          "resolvedModuleIdentifier": "c:\\aproject\\zhufengwebpack202011\\5.flow\\src\\title.js",
          "resolvedModule": "./src/title.js",
          "type": "cjs self exports reference",
          "active": true,
          "explanation": "",
          "userRequest": null,
          "loc": "1:0-14",
          "moduleId": "./src/title.js",
          "resolvedModuleId": "./src/title.js"
        }
      ],
      "usedExports": null,
      "providedExports": null,
      "optimizationBailout": [
        "CommonJS bailout: module.exports is used directly at 1:0-14"
      ],
      "depth": 1
    }
  ],
  "entrypoints": {
    "main": {
      "name": "main",
      "chunks": [
        "main"
      ],
      "assets": [
        {
          "name": "main.js",
          "size": 2332
        }
      ],
      "filteredAssets": 0,
      "assetsSize": 2332,
      "auxiliaryAssets": [],
      "filteredAuxiliaryAssets": 0,
      "auxiliaryAssetsSize": 0,
      "children": {},
      "childAssets": {},
      "isOverSizeLimit": false
    }
  },
  "namedChunkGroups": {
    "main": {
      "name": "main",
      "chunks": [
        "main"
      ],
      "assets": [
        {
          "name": "main.js",
          "size": 2332
        }
      ],
      "filteredAssets": 0,
      "assetsSize": 2332,
      "auxiliaryAssets": [],
      "filteredAuxiliaryAssets": 0,
      "auxiliaryAssetsSize": 0,
      "children": {},
      "childAssets": {},
      "isOverSizeLimit": false
    }
  },
  "errors": [],
  "errorsCount": 0,
  "warnings": [],
  "warningsCount": 0,
  "children": []
} 
*/
