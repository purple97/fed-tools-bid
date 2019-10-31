require('shelljs/global');
let colors = require('cli-color');
let program = require('commander');
let webServer = require('../../lib/server');
let utils = require('../../lib/utils');
let gitTools = utils.git;

module.exports = function() {
    process.env.NODE_ENV = 'dev';
    console.log(colors.green('开启开发者模式'));
    webServer.start({
        // port: program.port,
        port: program.args[0].port,
        queit: program.quiet
    });

    gitTools.setConfigVersion(); // 检测git分支，设置config.version
};
