const co = require('co');
const fs = require('fs');
const path = require('path');
const colors = require('cli-color');
const request = require('request');
const thunkify = require('thunkify');
// const exec = require('child_process').exec;
const utils = require('../../lib/utils');
const getAPIHost = require('../common/get-api-host');
const webpackRun = require('./webpack-run');
// const execThunk = thunkify(exec);
const handleApi = thunkify(request.post);
let buildPath = './deploy/build/';

const writeBuildJsonFile = function(filepath, data) {
    let jsonData = JSON.stringify(data);
    try {
        fs.writeFileSync(filepath, jsonData);
        console.log(colors.green('生成发布配置成功，请查看工程目录下的build.json文件。'));
    } catch (err) {
        console.log(colors.red('build.json写入失败，请检查该文件'));
        console.log(colors.red(JSON.stringify(err)));
    }
};

module.exports = function(deployJSON) {
    let APIURL = false;
    let filename = path.join(utils.path.cwdPath, 'build.json');
    let platformHost = getAPIHost(deployJSON.env);

    return co(function*() {
        writeBuildJsonFile(filename, deployJSON);
        if (deployJSON.env === 'local' || deployJSON.env === 'production-build' || deployJSON.env === 'tag') {
            // 默认只生成build.json 旧的发布方式
            let buildName = deployJSON.env === 'local' ? '日常' : deployJSON.env === 'production-build' ? '线上' : 'Tag';
            // let buildType = deployJSON.env === 'local' ? 'daily' : deployJSON.env;
            if (deployJSON.env !== 'local' && deployJSON.env !== 'daily' && deployJSON.env !== 'dev') {
                buildPath = './deploy/';
            }
            try {
                console.log(colors.blue(`开始进行本地[${buildName}]构建...`));
                // console.log('本地构建，deployJSON配置文件如下：');
                // console.log(deployJSON);
                // console.log(colors.blue(`gulp deploy --entry ${filename} --env ${buildType}`));
                webpackRun(buildPath, deployJSON, () => {
                    console.log(colors.green(`本地[${buildName}方式]构建结束!`));
                });
                // const execres = yield execThunk(`gulp deploy --entry ${filename} --env ${buildType}`); // 在本地进行线上构建
                // if (execres && Array.isArray(execres)) {
                //     console.log(execres[0]);
                // }
            } catch (e) {
                console.log(colors.red(`本地[${buildName}方式]构建失败！`));
                console.log(e);
            }
        } else if (
            deployJSON.env === 'daily' ||
            deployJSON.env === 'pre' ||
            deployJSON.env === 'productionNoTag' ||
            deployJSON.env === 'gray'
        ) {
            // console.log(colors.magentaBright('您可以手动执行构建命令：gulp deploy --entry ' + filename + ' --env ' + deployJSON.env));
            APIURL = `${getAPIHost(deployJSON.env)}/api/awp/publishNoTag.do`;
        }
        if (APIURL) {
            try {
                // console.log('=====调用发布接口=====');
                // console.log(APIURL);
                // console.log(deployJSON);
                platformHost = getAPIHost(deployJSON.env);
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
                    console.log(colors.green(`正在进行${deployJSON.env}发布:${res.data.publishKey}`));
                    console.log(
                        colors.green(
                            `请在以下页面中查看发布进度: ${platformHost}/awp/logmonitor?f=${res.data.appName}/${res.data.publishKey}.log`
                        )
                    );
                } else {
                    console.log(colors.red('发布异常'));
                    console.log(colors.red(JSON.stringify(res)));
                }
            } catch (e) {
                console.log(colors.red(APIURL));
                console.log(colors.red('调用awp发布接口异常'));
                console.log(e);
            }
        }
    });
};
