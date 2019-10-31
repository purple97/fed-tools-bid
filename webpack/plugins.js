const path = require('path');
const webpack = require('webpack');
const utils = require('../lib/utils');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
// const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');
const HtmlWebpackReplaceHost = require('./plugins/html-webpack-replace-host');
const HtmlWebpackInlineSourcePlugin = require('./plugins/html-webpack-inline-source-plugin');
// const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin');
// const HtmlStringReplace = require('html-string-replace-webpack-plugin');
// const CWDPATH = process.cwd();
// const buildJson = path.join(CWDPATH, './build.json');

function setHtmlPlugin(file, env) {
    const isOnline = env === 'tag' || env === 'productionNoTag' || env == 'production' || env === 'gray';
    let chunksName = path.dirname(file) + '/' + utils.getUserConfig.version + '/index';
    chunksName = chunksName.replace(/^\.\//, '');
    // chunksName = isOnline ? chunksName.replace(/[.\d]*\/index/g, 'index') : chunksName;
    const _filename = isOnline ? path.join('./html/build', file) : file;
    // console.log(path.join('./html/build', file), isOnline, chunksName);
    return new HtmlWebpackPlugin({
        version: utils.getUserConfig.version,
        inject: true,
        hash: true,
        minify: {
            collapseWhitespace: true,
            removeComments: true
        },
        filename: _filename,
        template: path.resolve(file),
        chunks: [chunksName]
    });
}

function getPlugins(filepath, env) {
    const jsHost = `${utils.getUserConfig.cdnhost}/${utils.getUserConfig.appName}/`;
    let config = [
        new webpack.DefinePlugin({ NODE_ENV: JSON.stringify(process.env.NODE_ENV) }),
        //避免重复的模块
        // new webpack.optimize.DedupePlugin()
        /* 跳过编译时出错的代码并记录 , webpack.NoErrorsPlugin webpack4后改为webpack.NoEmitOnErrorsPlugin */
        new webpack.NoEmitOnErrorsPlugin()
    ];
    console.log('process.env.NODE_ENV', process.env.NODE_ENV);
    if (process.env.NODE_ENV != 'dev') {
        config.push(new CleanWebpackPlugin());
        if (typeof filepath === 'string') {
            config.push(setHtmlPlugin(filepath, env));
        } else if (Array.isArray(filepath)) {
            filepath.forEach(function(file) {
                config.push(setHtmlPlugin(file, env));
            });
        }
        config.push(
            new HtmlWebpackReplaceHost({
                replaceString: env == 'local' || env == 'daily' ? '' : jsHost
            })
        );
        config.push(
            new HtmlWebpackInlineSourcePlugin({
                env: env == 'local' || env == 'daily' ? 'development' : 'production'
            })
        );
    }
    // console.log(config);
    return config;
}

module.exports = getPlugins;
