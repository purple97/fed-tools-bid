// const path = require('path');
const ejs = require('ejs');
const express = require('express');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const GetCatalog = require('./getCatalog'); // 获取并展示目录结构 中间件
const cssFile = require('./cssfile');
const getWebpackDevConfig = require('./getWebpackDevConfig');
const colors = require('cli-color');
const utils = require('../utils');
const getIP = require('../util/getip');
const _IP = getIP();

module.exports = {
    start: function(config) {
        let port = config.port;
        let app = new express();
        app.engine('html', ejs.__express);
        app.set('view engine', 'html');
        app.set('views', process.cwd());

        app.get('/build/**.css', cssFile);
        app.get('/src/**.css', cssFile);
        app.get('/src/**/index.html', function(req, res, next) {
            // console.log(req.path);
            //检测js路径和html中路径是否一致;
            if (utils.fileGenerator.checkHtmlFilePath(req.path)) {
                // next();
                res.render('.' + req.path, { htmlWebpackPlugin: null });
            } else {
                console.log(colors.red('index.js地址和html地址不匹配:' + req.path));
            }
        });
        app.get('/src/**/index.js', function(req, res, next) {
            if (/\/@cdnhost[\/\s\S]+@version/g.test(req.path)) {
                // 当开发环境请求带有@version的入口js时，重定向到移除@version/的路径
                // 新版的
                const filePath = req.path.replace(/\/@cdnhost[\/\s\S]+@version/g, '');
                res.redirect(filePath);
                return;
            }
            const webpackDevConfig = getWebpackDevConfig(req, res, next);
            const complier = webpack(webpackDevConfig);
            const middleware = webpackDevMiddleware(complier, {
                lazy: true,
                noInfo: config.queit || false,
                quiet: false,
                stats: {
                    colors: true
                }
            });
            middleware(req, res, next);
        });
        app.use('/', GetCatalog);
        app.use(express.static(utils.path.cwdPath));
        app.listen(port, function() {
            console.log(colors.green(`请复制地址到浏览器中 http://${_IP}:${port}`, '进行调试'));
        });
    }
};
