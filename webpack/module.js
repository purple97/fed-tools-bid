const getBabelConfig = require('./getBabelConfig');
module.exports = {
    rules: getBabelConfig(process.env.NODE_ENV),
    //不在扫正则所匹配的模块的依赖
    noParse: function(content) {
        const pass = /(lodash|zepto|jquery)\.js/.test(content);
        return pass;
    }
};
