const path = require('path');
let utils = require('../lib/utils');
let alias = utils.webpack.alias;
module.exports = {
    modules: [
        path.join(utils.path.cwdPath, 'src'),
        path.join(utils.path.cwdPath, 'node_modules'),
        path.join(utils.path.rootPath, 'node_modules')
    ],
    //require时候自动补全扩展名;
    extensions: ['.js', '.jsx', '.json', '.html', '.less'],
    alias: alias // 别名
};
