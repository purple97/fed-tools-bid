const path = require('path');
module.exports = function(env) {
    let configFileName = env === 'daily' || env === 'dev' ? 'dev.config.js' : 'production.config.js';
    const bidDir = path.join(__dirname, '../../webpack/' + configFileName);
    return require(bidDir);
};
