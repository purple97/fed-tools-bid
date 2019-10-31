function PreProcessor(options) {
    this.options = options || {};
}
PreProcessor.prototype = {
    process: function(css) {
        const options = this.options;
        const keys = Object.keys(options);
        let newCss = css;
        keys.forEach(key => {
            const re = new RegExp(`@${key}:(\\s|#|\\w)+;`);
            if (re.test(newCss)) {
                newCss = newCss.replace(re, value => {
                    // console.log('[less-replace]', `"${value}" to`, `"@${key}: ${options[key]};"`);
                    return `@${key}: ${options[key]};`;
                });
            }
        });
        return newCss;
    }
};

function lessVariableInjection(options) {
    this.options = options;
    // console.log(JSON.stringify(this.options))
}

lessVariableInjection.prototype = {
    //pluginManager提供一个可以添加文件管理器，后处理器或访问者的持有者。
    install: function(less, pluginManager) {
        // console.log(less, pluginManager);
        // addPreProcessor 预处理
        pluginManager.addPreProcessor(new PreProcessor(this.options));
    },
    // printUsage函数用于解释选项。
    printUsage: function() {},
    // setOptions函数传递字符串。
    setOptions: function() {},
    minVersion: [2, 1, 0]
};

module.exports = lessVariableInjection;
