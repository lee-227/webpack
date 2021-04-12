/**
 * 通过此插件完成2件事
 * 1. 自动向index.html里插入CDN脚本
 * 2. 当通过require或import引入模块的,变成一外部模块,而不进行打包
 * 3. 外链的模块和CDN的地址是可以随时修改
 */
const { ExternalModule } = require("webpack");
let HtmlWebpackPlugin = require('html-webpack-plugin');
class AutoExternalPlugin{
   constructor(options){
    this.options = options;
    this.importedModules = new Set();//[jquery,lodash]
   }
   apply(compiler){
    //普通模块工厂是用来创建普通模块的
    compiler.hooks.normalModuleFactory.tap('AutoExternalPlugin',(normalModuleFactory)=>{
        normalModuleFactory.hooks.parser
        .for('javascript/auto')
        .tap('AutoExternalPlugin',parser=>{//babel esprima acorn
            parser.hooks.import.tap('AutoExternalPlugin',(statement,source)=>{
                this.importedModules.add(source);//jquery
            });
            parser.hooks.call.for('require').tap('AutoExternalPlugin',(expression)=>{
                let value = expression.arguments[0].value;
                this.importedModules.add(value);//lodash
            });
        });
        //在normalModuleFactory内部，真正的生产模块的方法就是factory方法
        normalModuleFactory.hooks.factorize.tapAsync('AutoExternalPlugin',(resolveData, callback)=>{
            let request = resolveData.request;// ./src/index.js
           if(this.importedModules.has(request)){
            let variable = this.options[request].expose;// $
            callback(null,new ExternalModule(variable,'window',request));
           }else{
            callback();
           }
        });
    })
    compiler.hooks.compilation.tap('AutoExternalPlugin',(compilation)=>{
        //在老版html-webpack-plugin插件里,是直接给compilation.hooks加了一个钩子htmlWebpackPluginAlterAssetTags
        //新版的html-webpack-plugin插件,HtmlWebpackPlugin.getHooks(compilation).alterAssetTags
        HtmlWebpackPlugin.getHooks(compilation).alterAssetTags.tapAsync('AutoExternalPlugin',
        (htmlPluginData,callback)=>{
            //['jquery','lodash']=>['jquery']
            //jquery是模块名 jQuery是导入CDN脚本挂到window上的全局变量名
            Object.keys(this.options).filter(key=>this.importedModules.has(key)).forEach(name=>{
            let {expose,url} = this.options[name];
               htmlPluginData.assetTags.scripts.unshift({
                tagName: 'script',
                voidTag: false,
                attributes: { defer: false, src: url }
              });
            })
            callback(null,htmlPluginData);
        });

    });
   }
}

/**
 * 在本插件我们做什么，分成二步
 * 1.判断一下，查找一下本项目是否用到了某些模块
 * 2.改造生产模块的过程，如果这个模块配置为外部模块，就不需要打包了，会走外部模块流程，如果没有配置，就走正常的打包流程
 */

module.exports = AutoExternalPlugin;