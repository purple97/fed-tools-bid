// require('shelljs/global');
let co = require('co');
let fs = require('fs');
// let request = require('request');
let colors = require('cli-color');
let program = require('commander');
let Promise = require('promise');
let urllib = require('urllib');

module.exports = function() {
    console.log(colors.blue('现在开始 iconfont ttf 转换 base64 ...'));
    let parseUrl = function(text) {
        let urlRegex = /(https?:?)?(\/\/at.alicdn.com\/t\/font_.*\.ttf)/;
        if (urlRegex.exec(text)) {
            return 'http:' + RegExp.$2;
        }
        return false;
    };

    let parseLine = function(line) {
        return new Promise(function(resolve, reject) {
            let template = '    src: url(data:font/truetype;charset=utf-8;base64,<>) format("truetype");';
            let url = parseUrl(line);
            if (url) {
                urllib.request(url, function(err, data) {
                    if (err) reject(err);
                    let line = template.replace('<>', data.toString('base64'));
                    resolve(line);
                });
            } else {
                resolve(line);
            }
        });
    };

    co(function*() {
        let input, output;
        if (program.args[0].input) {
            input = program.args[0].input;
        } else {
            process.exit(1);
        }
        let fileContent = fs
            .readFileSync(input)
            .toString()
            .split('\n');
        let arr = [];

        fileContent.forEach(function(line) {
            arr.push(parseLine(line));
        });
        let data = yield arr;

        // 有输出路径则写到对应文件，否则直接替换原文件
        if (program.args[0].output) {
            output = program.args[0].output;
            fs.writeFileSync(output, data.join('\n'));
            console.log(colors.green('替换完成！'));
        } else {
            fs.writeFileSync(input, data.join('\n'));
            console.log(colors.yellow('没有指定输出路径，源文件替换完成！'));
        }
    });
};
