let path = require('path');
let utils = require('../utils');

module.exports = function(req, res, next) {
    let filePath = req.path;
    if (/index\.js$/.test(filePath)) {
        let entryObj = {};
        let pageName = filePath.substring(1, filePath.length - 3);
        entryObj[pageName] = './' + pageName;
        // console.log(entryObj);
        let webpackDevConfig = require('../../webpack/dev.config')(undefined, pageName);
        // 定义全集load 目录; 吧node_modules目录加入到require中;
        // webpackDevConfig.resolve.modules = [path.join(utils.path.cwdPath, 'src'), path.join(utils.path.cwdPath, 'node_modules')]; // 必须是绝对路径
        webpackDevConfig.entry = entryObj;
        webpackDevConfig.output.path = path.join(utils.path.cwdPath, 'bulid');
        return webpackDevConfig;
    } else {
        next();
    }
};
