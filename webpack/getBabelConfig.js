const path = require('path');
let utils = require('../lib/utils');
const lessVariableInjection = require('./plugins/less-variable-injection');
const dirSrc = path.join(utils.path.cwdPath, 'src');
const dirNodeModule = /node_modules/;
// const rootNodeModule = path.join(utils.path.rootPath, 'node_modules');
const configJson = utils.getUserConfig;

module.exports = function(env) {
    const isOnline = env == 'production';
    let jsx, ejs, less, css, json, file;
    jsx = {
        test: /\.(js|jsx)$/,
        // include: [dirSrc, /@bairong\//],
        exclude: /node_modules/,
        use: {
            loader: 'babel-loader',
            options: {
                presets: [[require('@babel/preset-env'), { modules: 'commonjs' }], require('@babel/preset-react')],
                plugins: [
                    require('@babel/plugin-proposal-class-properties'),
                    require('@babel/plugin-proposal-object-rest-spread'),
                    require('babel-plugin-add-module-exports'),
                    [
                        require('babel-plugin-import'),
                        {
                            libraryName: 'antd',
                            libraryDirectory: 'es',
                            style: 'css'
                        }
                    ]
                ],
                cacheDirectory: true
            }
        }
    };

    ejs = {
        test: /\.ejs$/,
        use: [{ loader: 'babel-loader' }, { loader: 'ejs-loader?variable=data' }],
        exclude: path.join(utils.path.rootPath, './node_modules')
    };
    less = {
        test: /\.less$/,
        include: [dirSrc, dirNodeModule],
        // exclude: /node_modules/,
        use: [
            { loader: 'style-loader' },
            { loader: 'css-loader' },
            {
                loader: 'less-loader',
                options: {
                    javascriptEnabled: true
                }
            }
        ]
    };
    css = {
        test: /\.css$/,
        include: [dirSrc, dirNodeModule],
        // exclude: /node_modules/,
        use: ['style-loader', 'css-loader']
    };

    json = {
        test: /\.json$/,
        exclude: /node_modules/,
        use: { loader: 'json-loader' }
    };

    file = {
        test: /\.(eot|svg|ttf|woff|woff2)$/,
        use: [
            {
                loader: 'file-loader'
            }
        ]
    };

    if (!isOnline) {
        jsx.use.options.plugins.unshift(require('@babel/plugin-transform-runtime'));
    }

    if (configJson.theme) {
        if (!less.use[2].options) {
            less.use[2].options = {};
        }
        if (!less.use[2].options.plugins) {
            less.use[2].options.plugins = [];
        }
        less.use[2].options.plugins.push(new lessVariableInjection(configJson.theme));
    }

    return [jsx, ejs, less, css, json, file];
};
