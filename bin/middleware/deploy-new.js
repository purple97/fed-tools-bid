/* eslint-disable require-atomic-updates */
require('shelljs/global');
const co = require('co');
// const fs = require('fs');
// const path = require('path');
const request = require('request');
const colors = require('cli-color');
const inquirer = require('inquirer');
// const program = require('commander');
const thunkify = require('thunkify');
const Rx = require('rx');
const utils = require('../../lib/utils');
// const exec = require('child_process').exec;
const getAPIHost = require('../common/get-api-host');
const buildStart = require('./build-new');
const lessToCss = require('./less-to-css');
// const getWebpackConfig = require('../../lib/util/get-webpack-config');
// console.log(getWebpackConfig());
const handleApi = thunkify(request.post);
// const execThunk = thunkify(exec);

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
        jsEntry: {},
        appName: null,
        remotes: null,
        version: null,
        websiteHost: null,
        cdnhost: null
    };
    // let BUILDINFOS = false;
    // let isPublish = false; // 是否构建后调用发布接口
    let configure = {}; // 读取自本地工程config.json配置

    let getDeployServerInfos = function*() {
        const host = getAPIHost('production');
        let resp = yield handleApi({
            // 调用发布接口
            url: host + '/api/awp/getDeployServerInfo.do',
            form: {}
        });
        let res = {};
        try {
            res = JSON.parse(resp[1]); // 获取res.body
        } catch (e) {
            console.log(colors.red('获取发布服务器信息返回解析异常'));
            console.log(e);
            return false;
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
        // try {
        // 	configure = yield setConfigVersion(deployJSON.tagBranch); // 检测git分支，设置config.version，并返回新的分支
        // } catch (e) {
        // 	console.log(colors.red('警告：当前不是git开发环境！'));
        // }
        // BUILDINFOS = utils.getBuildInfo(configure.version); // 使用新的git version重新更新buildInfo
        // deployJSON.htmlEntry = [];
        // deployJSON.jsEntry = {};
        // deployJSON.appName = configure.appName; // 应用名
        // deployJSON.remotes = configure.remotes; // Git远端地址
        // deployJSON.version = configure.version; // Git分支版本
        // deployJSON.websiteHost = configure.websiteHost; // 线上站点域名
        // deployJSON.cdnhost = configure.cdnhost; // 静态资源cdn域名

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
            } else if (env === 'gray') {
                prompts.onNext({
                    type: 'list',
                    name: 'publishGroup',
                    message: '请选择灰度服务器类型:',
                    choices: deployServerInfos.gray
                });
            } else if (env === 'productionNoTag') {
                prompts.onNext({
                    type: 'list',
                    name: 'publishGroup',
                    message: '请选择线上服务器类型:',
                    choices: deployServerInfos.productionNoTag
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
                        if (answer === 'daily' || answer === 'pre' || answer === 'productionNoTag' || answer === 'gray') {
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
            // onComplete
            function() {
                process.env.NODE_ENV = 'production';
                console.log(colors.blue('输入完成，正在生成发布配置文件...'));
                //构建css
                lessToCss(deployJSON.htmlEntry, function() {
                    //构建js
                    buildStart(deployJSON);
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
                    name: '灰度发布（CDN路径构建，仅构建发布html）',
                    value: 'gray'
                },
                {
                    name: '线上发布（CDN路径构建，仅构建发布html）',
                    value: 'productionNoTag'
                },
                {
                    name: '本地构建（仅在本地进行构建，但不上传发布）',
                    value: 'localBuild'
                }
            ]
        });
    });
};
