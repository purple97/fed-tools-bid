const webpack = require('webpack');
const colors = require('cli-color');
const getWebpackConfig = require('../../webpack/production.config');
const webpackRun = function(buildPath, deployJSON, callback) {
    const webpackConfig = getWebpackConfig(buildPath, deployJSON);
    webpackConfig.entry = deployJSON.jsEntry;
    // console.log(deployJSON.jsEntry);
    webpack(webpackConfig, (err, stats) => {
        console.log(stats.toString({ chunks: false, colors: true }));
        if (err || stats.hasErrors()) {
            console.log(colors.red('构建失败'));
            throw colors.red(JSON.stringify(err || stats.hasErrors()));
        }

        callback(null, stats);
    });
};

module.exports = webpackRun;
