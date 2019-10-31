let path = require('path');
let utils = require('../lib/utils');
const appInfo = require('../package.json');
// const optimizationConfig = require('./optimization');
const moduleConfig = require('./module');
const resolveConfig = require('./resolve');
const pluginsConfig = require('./plugins');
const performance = require('./performance');
const envTypesByOnline = ['tag', 'productionNoTag', 'production', 'gray'];
module.exports = function(outputPath, buildConfig) {
    console.log('[bid-pro-version]', appInfo.version);
    // console.log('[module-jsx]', JSON.stringify(moduleConfig.rules[0]));
    const isOnline = envTypesByOnline.indexOf(buildConfig.env) !== -1;
    let output = outputPath ? outputPath : './build';
    const _filename = isOnline ? 'javascripts/build/[name].js' : '[name].js';
    return {
        mode: 'production',
        performance: performance,
        entry: {},
        output: {
            path: path.resolve(utils.path.cwdPath, output),
            filename: _filename
        },
        //打包多文件和公共模块配置
        /* optimization: optimizationConfig, */

        resolveLoader: {
            modules: [path.join(utils.path.rootPath, 'node_modules'), path.join(utils.path.cwdPath, './node_modules')]
        },
        module: moduleConfig,
        resolve: resolveConfig,
        plugins: pluginsConfig(buildConfig.htmlEntry, buildConfig.env)
    };
};
