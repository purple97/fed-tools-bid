/**
 * 
 * @fileOverview 环境path

 * 
 */
const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');
const Repo = require('git-tools');
const colors = require('cli-color');
const npm = require('npm');
const semver = require('semver');
const cheerio = require('cheerio');
const inspect = require('util').inspect;

let gitRopo = new Repo(process.cwd());

let ROOTPATH = path.join(__dirname, '../'); // bid工具全局root path
let CWDPATH = process.cwd(); // 工程项目root path

const getUserConfig = (() => {
    /*
     *	读取工程根目录下的config.json
     */
    let configPath = path.join(process.cwd(), 'config.json');
    let configJSON = {};
    try {
        configJSON = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : configPath;
    } catch (e) {
        console.log(colors.red('解析"config.json"时出错。'));
        process.exit(1);
    }
    return configJSON;
})();

const getAlias = (() => {
    /*
     *	生成webpack resolve.alias 别名配置
     */
    let alias = {
        // 别名
        '@br': path.join(process.cwd(), './src/c/')
    };
    for (let aliasName in getUserConfig.alias) {
        getUserConfig.alias[aliasName] = getUserConfig.alias[aliasName].replace(/^@br\//, alias['@br']); // 将别名配置中的@br替换为'src/c'目录
    }
    alias = Object.assign(alias, getUserConfig.alias);
    return alias;
})();

const getNoParse = (() => {
    /*
     *	生成webpack module.noParse 配置
     *	忽略查找出现在其中的js所引入的依赖
     */
    let noParse = []; // 忽略查找出现在其中的js所引入的依赖
    if (getUserConfig.noParse) {
        noParse = noParse.concat(getUserConfig.noParse);
    }
    noParse.forEach(function(np, ind) {
        noParse[ind] = np.replace(/^@br\//, this.webpack.alias['@br']); // 替换@br别名
    });
    return noParse;
})();

module.exports = {
    path: {
        rootPath: ROOTPATH, // bid工具全局root path
        cwdPath: CWDPATH // 工程项目root path
    },
    getUserConfig: getUserConfig,
    webpack: {
        alias: getAlias,
        noParse: getNoParse
    },
    git: {
        repo: gitRopo,
        setConfigVersion: () => {
            let version = getUserConfig.version;
            gitRopo.currentBranch((error, b) => {
                if (!error) {
                    let reg = /^daily\/\d+\.\d+\.\d+$/g;
                    if (reg.test(b)) {
                        let branch = b.split('daily/')[1];
                        if (branch != version) {
                            console.log(colors.blue('将config.version由', version, '替换为', branch));
                            getUserConfig.version = branch;
                            let filename = path.join(CWDPATH, 'config.json');
                            let data = JSON.stringify(getUserConfig);
                            try {
                                fs.writeFileSync(filename, data);
                                console.log(colors.green('修改成功！'));
                                return getUserConfig;
                            } catch (err) {
                                console.log(colors.red('config.json写入失败，请检查该文件'));
                                console.log(colors.red(err));
                                return false;
                            }
                        }
                    } else {
                        console.log(colors.yellow('请在daily分支下进行开发：daily/x.y.z；'));
                        return false;
                    }
                } else {
                    console.log(colors.yellow('当前git环境异常。忽略config.verison更新'));
                    return false;
                }
            });
        },
        setConfigVersionThunk: (tagBranch, callback) => {
            let version = getUserConfig.version;
            gitRopo.remotes((err, remotes) => {
                if (!err) {
                    let gitRemotes = remotes[0].url;
                    getUserConfig.remotes = gitRemotes;
                    if (!tagBranch) {
                        // 非tag发布
                        gitRopo.currentBranch((error, b) => {
                            if (b === null) {
                                console.log(colors.magentaBright(`当前处于tag分支，将按照config.json配置中git的版本进行构建：${version}`));
                                let filename = path.join(CWDPATH, 'config.json');
                                let data = JSON.stringify(getUserConfig);
                                fs.writeFile(filename, data, err => {
                                    if (!err) {
                                        console.log(colors.green('修改成功！'));
                                        // return getUserConfig;
                                        return callback(err, getUserConfig);
                                    } else {
                                        console.log(colors.red('config.json写入失败，请检查该文件'));
                                        return callback(err, false);
                                    }
                                });
                            } else {
                                let reg = /^daily\/\d+\.\d+\.\d+$/g; // 只允许发布daily/x.y.z分支的代码，为保证安全，不支持tag回滚发布
                                if (reg.test(b)) {
                                    let branch = b.split('daily/')[1];
                                    if (branch != version) {
                                        console.log(colors.blue('将config.version由', version, '替换为', branch));
                                        getUserConfig.version = branch;
                                        let filename = path.join(CWDPATH, 'config.json');
                                        let data = JSON.stringify(getUserConfig);
                                        fs.writeFile(filename, data, err => {
                                            if (!err) {
                                                console.log(colors.green('修改成功！'));
                                                // return getUserConfig;
                                                return callback(err, getUserConfig);
                                            } else {
                                                console.log(colors.red('config.json写入失败，请检查该文件'));
                                                return callback(err, false);
                                            }
                                        });
                                    } else {
                                        console.log(colors.green('当前git环境正常：' + branch));
                                        return callback(error, getUserConfig);
                                    }
                                } else {
                                    console.log(colors.yellow('请在daily分支下进行发布：daily/x.y.z；'));
                                    return callback(error, false);
                                }
                            }
                        });
                    } else {
                        // tag发布
                        let hasTagFlag = false;
                        // todo bid tag version => 由tagBranch传递 publish/0.0.2
                        gitRopo.tags((error, branchs) => {
                            for (let index = 0; index < branchs.length; index++) {
                                let item = branchs[index];
                                if (item.name == tagBranch) {
                                    hasTagFlag = true;
                                }
                            }
                            if (hasTagFlag) {
                                console.log(colors.green('Git中存在当前tag分支。'));
                            } else {
                                console.log(colors.yellow('Git中不存在当前tag分支，请注意！'));
                            }
                            let pubreg = /^publish\/\d+\.\d+\.\d+$/g; // publish/x.y.z tag分支发布
                            if (pubreg.test(tagBranch)) {
                                // TODO 待测试！！
                                let branch = tagBranch.split('publish/')[1];
                                console.log(colors.blue('将config.version由', version, '替换为', branch));
                                getUserConfig.version = branch;
                                let filename = path.join(CWDPATH, 'config.json');
                                let data = JSON.stringify(getUserConfig);
                                fs.writeFile(filename, data, err => {
                                    if (!err) {
                                        console.log(colors.green('修改成功！'));
                                        return callback(err, getUserConfig);
                                    } else {
                                        console.log(colors.red('config.json写入失败，请检查该文件'));
                                        return callback(err, false);
                                    }
                                });
                            } else {
                                console.log(colors.yellow('请在publish分支下进行发布：publish/x.y.z；'));
                                return callback(error, false);
                            }
                        });
                    }
                } else {
                    return callback(err, false);
                }
            });
        }
    },
    getBuildInfo: version => {
        let devFilePath = path.join(process.cwd(), './src/p');
        let isInit = fs.existsSync(devFilePath);
        let autoGetEntry = version => {
            // 传递config.json的version字段，则自动在输出位置增加@version匹配。否则忽略@version
            let entry = {};
            let getJsEntry = dir => {
                fs.readdirSync(dir).forEach(file => {
                    let pathname = path.join(dir, file);

                    if (fs.statSync(pathname).isDirectory()) {
                        getJsEntry(pathname);
                    } else if (/index\.js$/.test(pathname)) {
                        let relFileName = './src/' + pathname.split('/src/')[1];
                        let v = version ? version + '/' : '';
                        let relFileKey = 'src/' + pathname.split('/src/')[1].split('index.js')[0] + v + 'index';
                        entry[relFileKey] = relFileName;
                    }
                });
                return entry;
            };
            if (isInit) {
                return getJsEntry(devFilePath);
            } else {
                return {};
            }
        };

        let autoGetHtml = version => {
            // 传递config.json的version字段，则自动在输出位置增加@version匹配。否则忽略@version
            let html = {
                keys: [],
                jsEntry: {},
                originList: []
            };
            let getJsHtml = dir => {
                // 递归遍历约定的目录结构，设置jsEntry配置
                fs.readdirSync(dir).forEach(file => {
                    let pathname = path.join(dir, file);

                    if (fs.statSync(pathname).isDirectory()) {
                        getJsHtml(pathname);
                    } else if (/index\.html$/.test(pathname)) {
                        let relFileName = './src/' + pathname.split('/src/')[1];
                        html.originList.push(relFileName);
                        let v = version ? version + '/' : '';
                        let relFileKey = 'src/' + pathname.split('/src/')[1].split('index.html')[0] + v + 'index';
                        let tmpJS = relFileName.replace(/\.html$/g, '.js');
                        let exists = fs.existsSync(path.join(process.cwd(), tmpJS));
                        if (exists) {
                            html.jsEntry[relFileKey] = tmpJS;
                        } else {
                            html.jsEntry[relFileKey] = false;
                        }
                        html.keys.push(relFileKey);
                    }
                });
            };
            if (isInit) {
                // 如果该项目路径已经进行了bid init初始化(拥有约定目录结构)
                getJsHtml(devFilePath);
                return html;
            } else {
                return {};
            }
        };
        return {
            autoGetEntry: autoGetEntry(version),
            autoGetHtml: autoGetHtml(version)
        };
    },
    fileGenerator: {
        projectGenerator: function(args, callback) {
            let dirname = args.dirname;
            let targetPath = '';
            let commonFilePath = path.join(path.join(__dirname, '..'), 'examples/commonFiles');

            if (!args.react) {
                targetPath = path.join(path.join(__dirname, '..'), 'examples/normal');
            } else {
                targetPath = path.join(path.join(__dirname, '..'), 'examples/react');
            }

            if (!dirname) {
                console.log(colors.red(`${dirname}目录不存在，初始化终止...`));
                process.exit(1);
            }

            fs.exists(path.join(dirname, './src'), function(exists) {
                if (exists) {
                    console.log(colors.yellow(`${path.join(dirname, './src')}目录已存在，初始化终止...`));
                    process.exit(1);
                }
                fse.copy(targetPath, dirname, {}, function() {
                    console.log(colors.green('目录结构创建成功！'));
                    if (typeof callback == 'function') {
                        callback();
                    }
                });
                fse.copy(commonFilePath, dirname, {}, function() {
                    console.log(colors.green('配置文件创建成功！'));
                });
            });
        },
        dependenciesGenerator1: function(args, callback) {
            // 安装gulp构建所需的全部依赖：
            // 	 1. 拷贝全局br-bid下的node_modules至项目根目录
            // 	 2. 拷贝全局br-bid/examples/gulpfile.js至项目根目录
            // 	 3. 拷贝全局br-bid至项目根目录/node_modules/
            // let error = false;
            let bidOriginNodeModulePath = path.join(__dirname, '../node_modules');
            let bidTargetNodeModuePath = path.join(process.cwd(), './node_modules');
            console.log(colors.white('-------------------------------------------'));
            console.log(colors.white(`BID工具node_modules目录：${bidOriginNodeModulePath}`));
            console.log(colors.white(`开发项目node_modules目录：${bidTargetNodeModuePath}`));
            console.log(colors.white('-------------------------------------------'));
            // console.log(bidOriginNodeModulePath);
            fse.copy(
                bidOriginNodeModulePath,
                bidTargetNodeModuePath,
                {
                    overwrite: true
                },
                function(error) {
                    if (typeof callback == 'function' && error) {
                        return callback(error);
                    }
                    typeof callback == 'function' && callback(error);
                    console.log(colors.green('相关依赖复制成功！'));
                }
            );
        },
        dependenciesGenerator: function(args, callback) {
            // 安装gulp构建所需的全部依赖：
            // 	 1. 拷贝全局br-bid下的node_modules至项目根目录
            // 	 2. 拷贝全局br-bid/examples/gulpfile.js至项目根目录
            // 	 3. 拷贝全局br-bid至项目根目录/node_modules/
            let bidOriginNodeModulePath = path.join(__dirname, '../node_modules');
            let bidTargetNodeModuePath = path.join(process.cwd(), './node_modules');
            console.log(colors.white('-------------------------------------------'));
            console.log(colors.white(`BID工具node_modules目录：${bidOriginNodeModulePath}`));
            console.log(colors.white(`开发项目node_modules目录：${bidTargetNodeModuePath}`));
            console.log(colors.white('-------------------------------------------'));
            let originGulpfilePath = path.join(__dirname, '../examples/commonFiles/gulpfile.js'); // 目标路径
            let targetGulpfilePath = path.join(process.cwd(), './gulpfile.js'); // 目标路径
            console.log(colors.white(`bid工具glupfile路径：${originGulpfilePath}`));
            console.log(colors.white(`目标glupfile路径：${targetGulpfilePath}`));
            console.log(colors.white('-------------------------------------------'));
            let bidOriginPath = path.join(__dirname, '../');
            let bidTargePath = path.join(process.cwd(), './node_modules/br-bid');
            console.log(colors.white(`bid工具路径：${bidOriginPath}`));
            console.log(colors.white(`目标BID路径：${bidTargePath}`));
            console.log(colors.white('-------------------------------------------'));

            fse.copy(
                bidOriginNodeModulePath,
                bidTargetNodeModuePath,
                {
                    overwrite: true
                },
                function(error) {
                    if (typeof callback == 'function' && error) {
                        return callback(error);
                    }
                    console.log(colors.green('相关依赖复制成功！'));
                    fse.copy(
                        originGulpfilePath,
                        targetGulpfilePath,
                        {
                            overwrite: true
                        },
                        function(err) {
                            console.log(colors.green('gulpfile.js拷贝成功！'));
                            if (typeof callback == 'function' && err) {
                                return callback(err);
                            }
                            fse.copy(
                                bidOriginPath,
                                bidTargePath,
                                {
                                    overwrite: true
                                },
                                function(e) {
                                    console.log(colors.green('br-bid拷贝成功！'));
                                    if (typeof callback == 'function') {
                                        callback(e);
                                    }
                                }
                            );
                        }
                    );
                }
            );
        },
        //检测js路径和html中路径是否一致;
        checkHtmlFilePath: function(filepath) {
            let isExist = true;
            let jssrc = filepath.replace('.html', '.js');
            jssrc = '@cdnhost' + jssrc.replace('index.js', '@version/index.js');
            let filedata = fs.readFileSync(path.join(process.cwd(), filepath), 'utf-8');
            let $ = cheerio.load(filedata);
            let Scripts = $('script[src="' + jssrc + '"]');
            if (Scripts.length <= 0) {
                isExist = false;
            }
            return isExist;
        }
    },
    npm: {
        checkNpm: function(name, cb) {
            // 检测NPM版本
            npm.load(
                {
                    loglevel: 'silent'
                },
                function(err) {
                    if (npm && npm.registry && npm.registry.log && npm.registry.log.level) {
                        npm.registry.log.level = 'silent';
                    }
                    if (err) {
                        return cb(err);
                    }
                    let silent = true;
                    npm.commands.view([name], silent, function(err, data) {
                        if (err) return cb(err);
                        if (!data) return cb(new Error('No data received.'));

                        for (let p in data) {
                            if (!data.hasOwnProperty(p) || !semver.valid(p)) continue;
                            return cb(null, p, data[p]);
                        }
                        return cb(new Error('Bad data received: ' + inspect(data)));
                    });
                }
            );
        }
    }
};
