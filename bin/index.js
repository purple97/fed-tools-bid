#!/usr/bin/env node

/**
 *
 * @fileOverview bash命令定义
 *
 */

const colors = require('cli-color');
const program = require('commander');
const appInfo = require('../package.json');
const lint = require('./middleware/lint-new');
const init = require('./middleware/init');
const runBuild = require('./middleware/run-build');
const version = require('./middleware/version');
const dev = require('./middleware/dev');
const deployNew = require('./middleware/deploy-new');
const iconfont = require('./middleware/iconfont');
const LOGO = colors.xterm(20).bgXterm(226);

program
    .allowUnknownOption() //不报错误
    .version(appInfo.version)
    .usage('FEDTools前端开发工具')
    .option('-q, --quiet', '安静模式')
    .option('-r, --react', '初始化react工程')
    .action(function() {
        console.log(LOGO(' _____ _____ ____ _____           _     '));
        console.log(LOGO('|  ___| ____|  _ \\_   _|__   ___ | |___ '));
        console.log(LOGO('| |_  |  _| | | | || |/ _ \\ / _ \\| / __|'));
        console.log(LOGO('|  _| | |___| |_| || | (_) | (_) | \\__ \\'));
        console.log(LOGO('|_|   |_____|____/ |_|\\___/ \\___/|_|___/'));
    })
    .parse(process.argv);

program
    .command('lint')
    .alias('l')
    .description('代码检测')
    // .option('-i, --input [type]', '路径')
    .action(function(cmd, options) {
        lint(cmd, options);
    })
    .on('--help', function() {
        console.log('  举个栗子:');
        console.log('');
        console.log('    bid lint   :   js代码规范检测');
        console.log('');
        process.exit(1);
    });

program
    .command('version')
    .alias('v')
    .description('版本信息')
    // .option('-i, --input [type]', '路径')
    .action(function(cmd, options) {
        version(cmd, options);
    })
    .on('--help', function() {
        console.log('  举个栗子:');
        console.log('');
        console.log('    bid version   :   版本信息检测');
        console.log('');
        process.exit(1);
    });

program
    .command('build')
    .alias('p')
    .description('进行构建')
    .option('-e, --entry ./build.json', '发布配置文件路径')
    .action(function(cmd, options) {
        runBuild(cmd, options);
    })
    .on('--help', function() {
        console.log('  举个栗子:');
        console.log('');
        console.log('bid deploy');
        console.log('');
        process.exit(1);
    });

program
    .command('dev')
    .alias('d')
    .description('进行开发')
    .option('-p, --port [type]', '监听端口', '3333')
    .action(function(cmd, options) {
        dev(cmd, options);
    })
    .on('--help', function() {
        console.log('  举个栗子:');
        console.log('');
        console.log('    bid dev,开启本地开发者模式');
        console.log('    bid dev -p|--port [端口号]   :   指定端口号');
        console.log('');
        process.exit(1);
    });

program
    .command('init')
    .alias('i')
    .description('初始化工程目录')
    .action(function(cmd, options) {
        init(cmd, options);
    })
    .on('--help', function() {
        console.log('  举个栗子:');
        console.log('');
        console.log('    bid init     ,   在当前路径下初始化[通用]工程目录');
        console.log('    bid init -r  ,   在当前路径下初始化[react]工程目录');
        console.log('');
        process.exit(1);
    });

program
    .command('iconfont')
    .description('iconfont ttf 2 base64')
    .option('-i, --input <file>', 'less或者css文件')
    .option('-o, --output <file>', '输出到此路径')
    .action(function(cmd, options) {
        iconfont(cmd, options);
    })
    .on('--help', function() {
        process.exit(1);
    });

program
    .command('deploy')
    .alias('p')
    .description('进行构建')
    .action(function(cmd, options) {
        deployNew(cmd, options);
    })
    .on('--help', function() {
        console.log('  举个栗子:');
        console.log('');
        console.log('bid deploy');
        console.log('');
        process.exit(1);
    });

program
    .command('deploynew')
    .alias('n')
    .description('进行构建')
    .action(function(cmd, options) {
        deployNew(cmd, options);
    })
    .on('--help', function() {
        console.log('  举个栗子:');
        console.log('');
        console.log('bid deploynew');
        console.log('');
        process.exit(1);
    });

program.parse(process.argv);
