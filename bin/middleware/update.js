require('shelljs/global');
// const co = require('co');
// const fs = require('fs');
const path = require('path');
// const request = require('request');
const colors = require('cli-color');
const utils = require('../../lib/utils');

module.exports = function() {
    console.log(colors.blue('开始更新工程构建所需要的依赖模块...'));
    const initTime = new Date().getTime();
    const dirname = path.resolve('/usr/local/lib/node_modules');
    console.log(__dirname);
    utils.fileGenerator.dependenciesGenerator1(
        {
            // 复制依赖文件Node_modules
            dirname: dirname
        },
        function(error) {
            const nowTime = new Date().getTime();
            if (!error) {
                console.log(colors.green('依赖更新完成!'), colors.blue('共耗时:' + (nowTime - initTime) / 1000, 's'));
            } else {
                console.log(colors.red('拷贝依赖文件失败!'), colors.blue('共耗时:' + (nowTime - initTime) / 1000, 's'));
                console.log(colors.red(error));
            }
        }
    );
};
