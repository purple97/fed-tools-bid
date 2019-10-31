require('shelljs/global');
const co = require('co');
const fs = require('fs');
const path = require('path');
const colors = require('cli-color');
const inquirer = require('inquirer');
const program = require('commander');
const exec = require('child_process').exec;
const thunkify = require('thunkify');
const execThunk = thunkify(exec);
let utils = require('../../lib/utils');

let USERCONFIG = utils.getUserConfig; //读取工程根目录下的config.json
let BUILDINFOS = utils.getBuildInfo(USERCONFIG.version); //返回所有autoGetEntry({'带版本号的js':'XX.js'}),返回所有autoGetHtml({html = {keys: [],jsEntry: {},originList: [html目录]}})
let gitTools = utils.git;
let setConfigVersion = thunkify(function(version, callback) {
    let branch = version ? version : false;
    gitTools.setConfigVersionThunk(branch, function(err, config) {
        return callback(err, config);
    });
});

module.exports = () => {
    let deployJSON = null; // build.json源
    // let isPublish = false; // 是否构建后调用发布接口
    let configure = {}; // 读取自本地工程config.json配置

    co(function*() {
        try {
            //就是项目中config.json文件
            configure = yield setConfigVersion(false); // 检测git分支，设置config.version，并返回新的分支
        } catch (e) {
            console.log(colors.red('警告：当前不是git开发环境！'));
        }
        inquirer
            .prompt([
                {
                    type: 'input',
                    name: 'username',
                    message: '请输入您的用户名:'
                },
                {
                    type: 'list',
                    name: 'env',
                    message: '请选择发布环境:',
                    choices: [
                        {
                            name: '日常发布（相对路径构建，同时构建发布js、html）',
                            value: 'daily'
                        },
                        {
                            name: '预发发布（相对路径构建，同时构建发布js、html）',
                            value: 'pre'
                        },
                        {
                            name: '线上发布（CDN路径构建，仅构建发布html）',
                            value: 'production'
                        }
                    ] //['本地生成部署配置', '日常环境', '预发环境', '线上环境']
                },
                {
                    type: 'checkbox',
                    name: 'selectedEntry',
                    message: '请选择需要进行构建的页面:',
                    choices: BUILDINFOS.autoGetHtml.keys
                }
            ])
            .then(function(answers) {
                //根据用户选择的页面生成build.JSON
                deployJSON = answers;
                deployJSON.htmlEntry = [];
                deployJSON.jsEntry = {};
                deployJSON.appName = configure.appName; // 应用名
                deployJSON.remotes = configure.remotes; // Git远端地址
                deployJSON.version = configure.version; // Git分支版本
                deployJSON.publish = configure.publish; // 发布配置信息
                deployJSON.cdnhost = configure.cdnhost; // 静态资源cdn域名
                answers.selectedEntry.forEach(function(se) {
                    // 生成发布列表，构建列表
                    for (let htmlKey in BUILDINFOS.autoGetHtml.jsEntry) {
                        if (htmlKey.split(se).length > 1) {
                            let tmpSrc = './' + htmlKey + '.html';
                            if (configure.version) {
                                tmpSrc = tmpSrc.replace(configure.version + '/', '');
                            }
                            if (BUILDINFOS.autoGetHtml.jsEntry[htmlKey]) {
                                deployJSON.jsEntry[htmlKey] = BUILDINFOS.autoGetHtml.jsEntry[htmlKey];
                            }
                            deployJSON.htmlEntry.push(tmpSrc);
                            break;
                        }
                    }
                });
                return deployJSON;
            })
            .then(function(data) {
                if (data.selectedEntry.length == 0) {
                    return console.log(colors.red('没有选择任何页面,构建结束'));
                }
                co(function*() {
                    let filename = path.join(utils.path.cwdPath, 'build.json');
                    console.log(colors.green('gulp deploy --entry ' + filename + ' --env ' + data.env));
                    let jsonData = JSON.stringify(data);

                    try {
                        fs.writeFileSync(filename, jsonData); //创建build.json文件
                        console.log(colors.green('build.json创建成功'));
                    } catch (err) {
                        console.log(colors.red('build.json写入失败，请检查该文件'));
                        console.log(colors.red(JSON.stringify(err)));
                    }

                    try {
                        //此处阻塞住，去执行gulfile.js文件的任务
                        yield execThunk('gulp deploy --entry ' + filename + ' --env daily'); // 在本地进行build
                    } catch (e) {
                        console.log(colors.red('本地线上构建失败！'));
                        console.log(e);
                    }

                    let chmod777 = function() {
                        let start777 = new Date().getTime();
                        exec(
                            'chmod -R 777 ./deploy',
                            {
                                async: true,
                                silent: program.quiet
                            },
                            function() {
                                let end777 = new Date().getTime();
                                console.log(colors.green('修改build权限777完成，共耗时:' + (end777 - start777) / 1000, 's'));
                                // chmod777();
                            }
                        );
                    };

                    chmod777();
                    const callbackFn = function(userName) {
                        if (userName) {
                            // 校验用户名
                            let serverType = '默认';
                            let doPublish = function(confArr) {
                                let scpStartTime = new Date().getTime();
                                // exec('scp -r ./build root@101.200.132.102:/home', {
                                // exec('scp -r ./build/ ' + userName + '@192.168.180.10:/opt/www/minions', {
                                // 由于服务器端免密钥或交互式shell需要运维配合，开发成本较高，必所以暂时使用手工创建日常服务器项目目录的办法；
                                // 日常发布时，须保证服务器上已经存在项目文件夹，否则需要手动新建，并将owner设置为www,权限777,否则可能会影响日常发布
                                // console.log('scp -r ./build/* ' + userName + '@' + publishHost + ':' + publishPath + USERCONFIG.appName)
                                let $path = confArr.path; //本地的项目工程路径
                                confArr.host.forEach(function(host) {
                                    let scpCmd = 'scp -r ./deploy/build/* ' + userName + '@' + host + ':' + $path + USERCONFIG.appName;
                                    //scp -r ./deploy/build/* an.zhao@192.168.180.10:/opt/www/build/fedceshi
                                    console.log(scpCmd);
                                    exec(
                                        scpCmd,
                                        {
                                            async: true
                                        },
                                        function() {
                                            let nowTime = new Date().getTime();
                                            console.log(colors.green('已成功上传到 [' + serverType + ']（' + host + '） 服务器!'));
                                            console.log(colors.blue('上传耗时:' + (nowTime - scpStartTime) / 1000, 's'));
                                        }
                                    );
                                });
                            };
                            try {
                                if (data.env === 'daily') {
                                    // 发布日常
                                    serverType = '日常';
                                    doPublish(USERCONFIG.publish.daily);
                                } else if (data.env === 'pre') {
                                    // 发布预发阿里云
                                    serverType = '预发';
                                    doPublish(USERCONFIG.publish.pre);
                                } else if (data.env === 'production') {
                                    // 发布线上阿里云
                                    serverType = '线上';
                                    doPublish(USERCONFIG.publish.production);
                                } else {
                                    colors.yellow('发布未成功，因为您没有指定正确的发布环境');
                                }
                            } catch (e) {
                                console.log(colors.red('config.json发布配置错误，' + serverType + '发布失败'));
                                console.log(colors.red(e));
                            }
                        } else {
                            console.log(colors.red('上传失败，无法解析您输入的userName'));
                        }
                    };
                    callbackFn(data.username);
                    console.log(colors.green('构建完毕!'));
                });
            });
    });
};
