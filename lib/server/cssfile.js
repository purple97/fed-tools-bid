/**
 * @fileOverview
 * @author dezhao
 */
// let path = require('path');
let lessMiddleware = require('less-middleware');

module.exports = lessMiddleware(process.cwd(), {
    preprocess: {
        path: function(pathname) {
            let _path = pathname;
            if (_path.indexOf('/build') != -1) {
                _path = pathname.replace(/build/, 'src');
            }
            return _path;
        }
    },
    //dest: path.join(process.cwd()),
    debug: true
});
