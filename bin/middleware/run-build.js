const fs = require('fs');
const path = require('path');
const colors = require('cli-color');
const lessToCss = require('./less-to-css');
const buildStart = require('./build-new');
const webpackRun = require('./webpack-run');
let buildPath = './deploy/build/';

module.exports = (cmd, options) => {
    if (typeof cmd !== 'string') {
        console.log('请输入build.json文件路径');
        return;
    }
    const buildJsonPaht = path.resolve(path.relative(process.cwd(), cmd));
    console.log(buildJsonPaht);
    if (!fs.existsSync(buildJsonPaht)) {
        console.log('未找到build.json文件');
        return;
    }
    const deployJSON = require(buildJsonPaht);
    process.env.NODE_ENV = deployJSON.env;
    if (deployJSON.env !== 'local' && deployJSON.env !== 'daily' && deployJSON.env !== 'dev') {
        buildPath = './deploy/';
    }
    console.log(colors.blue('开始构建...'));
    //构建css
    lessToCss(deployJSON.htmlEntry, function() {
        //构建js
        // webpackRun(deployJSON);
        webpackRun(buildPath, deployJSON, () => {
            console.log(colors.green(`本地构建结束!`));
        });
    });
};
