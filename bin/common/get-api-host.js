module.exports = function(env) {
    if (env == 'dev') {
        return 'http://awp.fed.com/';
    } else if (env === 'daily') {
        return 'http://awp.fed.com/';
    } else if (env === 'pre') {
        return 'http://awp.fed.com/';
    } else if (env === 'production' || env === 'productionNoTag') {
        return 'http://awp.fed.com/';
    } else if (env === 'gray') {
        return 'http://awp.fed.com/';
    } else {
        return false;
    }
};
