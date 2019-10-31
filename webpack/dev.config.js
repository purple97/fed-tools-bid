let path = require('path');
let utils = require('../lib/utils');
const appInfo = require('../package.json');
// const optimizationConfig = require('./optimization');
const moduleConfig = require('./module');
const resolveConfig = require('./resolve');
const pluginsConfig = require('./plugins');
const performance = require('./performance');
// console.log(path.join(utils.path.rootPath, 'node_modules'), path.join(utils.path.cwdPath, './node_modules'));
module.exports = function(outputPath, filePath) {
    console.log('[bid-dev-version]', appInfo.version);
    let output = outputPath ? outputPath : './build';
    return {
        mode: 'development',
        performance: performance,
        entry: {},
        output: {
            path: path.resolve(utils.path.cwdPath, output),
            filename: '[name].js'
        },
        //打包多文件和公共模块配置
        /* optimization: optimizationConfig, */
        resolveLoader: {
            // modules: [path.join(__dirname, "./node_modules")]
            modules: [path.join(utils.path.cwdPath, 'node_modules'), path.join(utils.path.rootPath, 'node_modules')]
        },
        externals: {
            // 使用CDN/远程文件
        },
        module: moduleConfig,
        resolve: resolveConfig,
        plugins: pluginsConfig(filePath)
    };
};
