// require('shelljs/global');
const path = require('path');
const colors = require('cli-color');
const program = require('commander');
const utils = require('../../lib/utils');

module.exports = function() {
    console.log(colors.green('正在初始化工程目录ing...'));
    let dirname = path.join(process.cwd(), './');
    /*let dependencies = ' webpack gulp gulp-uglify del gulp-jshint gulp-inline-source gulp-htmlmin gulp-inline-css gulp-replace underscore gulp-util cli-color br-bid ';
    if (program.react) { // 初始化react工程
        dependencies += ' react react-dom redux react-redux redux-thunk';
    }*/
    utils.fileGenerator.projectGenerator(
        {
            dirname: dirname,
            react: program.react
        },
        function() {
            // 初始化常规工程
            console.log(colors.blue('正在安装工程构建所需要的依赖模块...'));
            let initTime = new Date().getTime();
            utils.fileGenerator.dependenciesGenerator(
                {
                    // 复制依赖文件Node_modules
                    dirname: dirname
                },
                function(error) {
                    let nowTime = new Date().getTime();
                    if (!error) {
                        console.log(colors.green('依赖文件拷贝完成!'), colors.blue('共耗时:' + (nowTime - initTime) / 1000, 's'));
                    } else {
                        console.log(colors.red('拷贝依赖文件失败!'), colors.blue('共耗时:' + (nowTime - initTime) / 1000, 's'));
                        console.log(colors.red(error));
                    }
                }
            );
        }
    );
};
