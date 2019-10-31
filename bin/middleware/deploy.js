require('shelljs/global');
const co = require('co');
const fs = require('fs');
const path = require('path');
const request = require('request');
const colors = require('cli-color');
const inquirer = require('inquirer');
const thunkify = require('thunkify');
const Rx = require('rx');
const exec = require('child_process').exec;
const utils = require('../../lib/utils');
const getAPIHost = require('../common/get-api-host');

const handleApi = thunkify(request.post);
const execThunk = thunkify(exec);

let USERCONFIG = utils.getUserConfig; //读取工程根目录下的config.json
let BUILDINFOS = utils.getBuildInfo(USERCONFIG.version); //返回所有autoGetEntry({'带版本号的js':'XX.js'}),返回所有autoGetHtml({html = {keys: [],jsEntry: {},originList: [html目录]}})
let gitTools = utils.git;
let setConfigVersion = thunkify(function(version, callback) {
    let branch = version ? version : false;
    gitTools.setConfigVersionThunk(branch, function(err, config) {
        return callback(err, config);
    });
});
module.exports = function() {
    let deployJSON = {
        htmlEntry: [],
        jsEntry: {}
    };
    // let BUILDINFOS = false;
    // let isPublish = false; // 是否构建后调用发布接口
    let configure = {}; // 读取自本地工程config.json配置
    let writeBuildJsonFile = function(filepath, data) {
        let jsonData = JSON.stringify(data);
        try {
            fs.writeFileSync(filepath, jsonData);
            console.log(colors.green('生成发布配置成功，请查看工程目录下的build.json文件。'));
        } catch (err) {
            console.log(colors.red('build.json写入失败，请检查该文件'));
            console.log(colors.red(JSON.stringify(err)));
        }
    };
    let getDeployServerInfos = function*() {
        let resp = yield handleApi({
            // 调用发布接口
            url: `${getAPIHost('production')}/api/awp/getDeployServerInfo.do`,
            form: {}
        });
        let res = {};
        try {
            res = JSON.parse(resp[1]); // 获取res.body
        } catch (e) {
            console.log(colors.red('获取发布服务器信息返回解析异常'));
            console.log(e);
        }
        if (res.success) {
            console.log(colors.green('获取发布服务器信息成功'));
            return res.data;
        } else {
            console.log(colors.red('获取发布服务器信息返回异常'));
            console.log(colors.red(JSON.stringify(res)));
            return false;
        }
    };

    co(function*() {
        let deployServerInfos = yield getDeployServerInfos(); // 获取发布环境及服务器信息

        let prompts = new Rx.Subject();
        let addServerPrompts = function(env) {
            // 检测是否获取了服务器信息，如果获取异常，且为日常、预发、线上发布，则退出
            if (!deployServerInfos) {
                return prompts.onError('获取发布服务器信息异常，云端发布失败');
            }
            if (env === 'daily') {
                prompts.onNext({
                    type: 'list',
                    name: 'publishGroup',
                    message: '请选择日常环境类型:',
                    choices: deployServerInfos.daily
                });
            } else if (env === 'pre') {
                prompts.onNext({
                    type: 'list',
                    name: 'publishGroup',
                    message: '请选择预发服务器类型:',
                    choices: deployServerInfos.pre
                });
            } else if (env === 'production') {
                prompts.onNext({
                    type: 'list',
                    name: 'publishGroup',
                    message: '请选择线上服务器类型:',
                    choices: deployServerInfos.production
                });
            }
        };
        let addUserInfoPrompts = function() {
            // 增加输入用户名、密码 inputer
            prompts.onNext({
                type: 'input',
                name: 'username',
                message: '请输入您的用户名:'
            });
            prompts.onNext({
                type: 'password',
                name: 'password',
                message: '请输入您的密码:'
            });
        };
        let getBuildInfoConfig = function*() {
            try {
                configure = yield setConfigVersion(deployJSON.tagBranch); // 检测git分支，设置config.version，并返回新的分支
                BUILDINFOS = utils.getBuildInfo(configure.version); // 使用新的git version重新更新buildInfo,返回所有带有映射关系的js和html
                deployJSON.appName = configure.appName; // 应用名
                deployJSON.remotes = configure.remotes; // Git远端地址
                deployJSON.version = configure.version; // Git分支版本
                deployJSON.websiteHost = configure.websiteHost; // 线上站点域名
                deployJSON.cdnhost = configure.cdnhost; // 静态资源cdn域名
            } catch (e) {
                console.log(colors.red('警告：当前不是git开发环境！'));
                console.log(e);
            }
        };
        inquirer.prompt(prompts).ui.process.subscribe(
            function(data) {
                // onEachAnswer
                co(function*() {
                    let answer = data.answer;
                    if (data.name === 'env') {
                        if (answer === 'daily' || answer === 'pre' || answer === 'production') {
                            deployJSON.env = answer;
                            addServerPrompts(answer);
                            addUserInfoPrompts();
                            yield getBuildInfoConfig();
                            prompts.onNext({
                                type: 'checkbox',
                                name: 'selectedEntry',
                                message: '请选择需要进行构建的页面:',
                                choices: BUILDINFOS.autoGetHtml.keys
                            });
                        } else if (answer === 'localBuild') {
                            prompts.onNext({
                                type: 'list',
                                name: 'envNext',
                                message: '请选择本地构建方式:',
                                choices: [
                                    {
                                        name: '[日常方式] 本地构建',
                                        value: 'local'
                                    },
                                    {
                                        name: '[线上方式] 本地构建',
                                        value: 'production-build'
                                    },
                                    {
                                        name: '[Tag方式] 本地构建',
                                        value: 'tag'
                                    }
                                ]
                            });
                        } else {
                            prompts.onError(`非法环境：[ ${answer} ]`);
                        }
                    }

                    if (data.name === 'envNext') {
                        deployJSON.env = answer;
                        if (answer === 'tag') {
                            prompts.onNext({
                                type: 'input',
                                name: 'tagBranch',
                                message: '请输入tag分支号（如：publish/1.0.0）:'
                            });
                        } else {
                            yield getBuildInfoConfig();
                            prompts.onNext({
                                type: 'checkbox',
                                name: 'selectedEntry',
                                message: '请选择需要进行构建的页面:',
                                choices: BUILDINFOS.autoGetHtml.keys
                            });
                        }
                    }

                    if (data.name === 'tagBranch') {
                        deployJSON.tagBranch = answer;
                        yield getBuildInfoConfig();
                        prompts.onNext({
                            type: 'checkbox',
                            name: 'selectedEntry',
                            message: '请选择需要进行构建的页面:',
                            choices: BUILDINFOS.autoGetHtml.keys
                        });
                    }

                    if (data.name === 'publishGroup') {
                        deployJSON.publish = answer;
                    }
                    if (data.name === 'username') {
                        if (answer) {
                            deployJSON.username = answer;
                        } else {
                            prompts.onError('未输入用户名');
                        }
                    }
                    if (data.name === 'password') {
                        if (answer) {
                            deployJSON.password = answer;
                        } else {
                            prompts.onError('未输入密码');
                        }
                    }
                    if (data.name === 'selectedEntry') {
                        if (answer.length > 0) {
                            deployJSON.selectedEntry = answer;
                            answer.forEach(function(se) {
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
                            console.log('=========== deployJSON ============');
                            console.log(deployJSON);
                            prompts.onCompleted(deployJSON);
                        } else {
                            prompts.onError('没有选择任何页面，操作结束。');
                        }
                    }
                });
            },
            function(data) {
                // onError
                console.log(colors.red(data));
            },
            function() {
                // onComplete
                console.log(colors.blue('输入完成，正在生成发布配置文件...'));
                let APIURL = false;
                let filename = path.join(utils.path.cwdPath, 'build.json');
                co(function*() {
                    writeBuildJsonFile(filename, deployJSON);
                    if (deployJSON.env === 'local' || deployJSON.env === 'production-build' || deployJSON.env === 'tag') {
                        // 默认只生成build.json 旧的发布方式
                        let buildName = deployJSON.env === 'local' ? '日常' : deployJSON.env === 'production-build' ? '线上' : 'Tag';
                        let buildType = deployJSON.env === 'local' ? 'daily' : deployJSON.env;
                        try {
                            console.log(colors.blue(`开始进行本地[${buildName}]构建...`));
                            console.log('本地构建，deployJSON配置文件如下：');
                            console.log(deployJSON);
                            console.log(colors.blue(`gulp deploy --entry ${filename} --env ${buildType}`));
                            yield execThunk(`gulp deploy --entry ${filename} --env ${buildType}`); // 在本地进行线上构建
                            console.log(colors.green(`本地[${buildName}方式]构建完成!`));
                        } catch (e) {
                            console.log(colors.red(`本地[${buildName}方式]构建失败！`));
                            console.log(e);
                        }
                    } else if (deployJSON.env === 'daily' || deployJSON.env === 'pre' || deployJSON.env === 'production') {
                        console.log(
                            colors.magentaBright('您可以手动执行构建命令：gulp deploy --entry ' + filename + ' --env ' + deployJSON.env)
                        );
                        APIURL = `${getAPIHost(deployJSON.env)}/api/awp/publish.do`;
                    }
                    if (APIURL) {
                        try {
                            // console.log('=====调用发布接口=====');
                            // console.log(APIURL);
                            // console.log(deployJSON);
                            let platformHost = getAPIHost(deployJSON.env); //接口对应环境的域名
                            let resp = yield handleApi({
                                // 调用发布接口
                                url: APIURL,
                                form: deployJSON
                            });
                            let res = {};
                            try {
                                res = JSON.parse(resp[1]); // 获取res.body
                                // console.log(res);
                            } catch (e) {
                                console.log(colors.red('发布接口返回异常'));
                                console.log(e);
                            }
                            if (res.success) {
                                console.log(colors.green('正在进行' + deployJSON.env + '发布:' + res.data.publishKey));
                                console.log(
                                    colors.green(
                                        '请在以下页面中查看发布进度: ' +
                                            platformHost +
                                            '/awp/logmonitor?f=' +
                                            res.data.appName +
                                            '/' +
                                            res.data.publishKey +
                                            '.log'
                                    )
                                );
                            } else {
                                console.log(colors.red('发布异常'));
                                console.log(colors.red(JSON.stringify(res)));
                            }
                        } catch (e) {
                            console.log(colors.red('调用awp发布接口异常'));
                            console.log(e);
                        }
                    }
                });
            }
        );
        prompts.onNext({
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
                },
                {
                    name: '本地构建（仅在本地进行构建，但不上传发布）',
                    value: 'localBuild'
                }
            ]
        });
    });
};
