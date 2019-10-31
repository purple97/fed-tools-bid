const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
// const UglifyJS = require('uglify-js');
const HtmlWebpackPlugin = require('html-webpack-plugin');
// const { inlineSource } = require('inline-source');

class HtmlWebpackInlineSourcePlugin {
    constructor(options) {
        this.options = options;
    }

    apply(compiler) {
        const self = this;
        if (HtmlWebpackPlugin.getHooks) {
            compiler.hooks.compilation.tap('HtmlWebpackInlineSourcePlugin', compilation => {
                HtmlWebpackPlugin.getHooks(compilation).alterAssetTagGroups.tapAsync('HtmlWebpackInlineSourcePlugin', (data, callback) => {
                    // console.log(data);
                    callback(null, data);
                });
            });
        } else {
            // HtmlWebpackPlugin version 3.2.0
            compiler.plugin('compilation', compilation => {
                compilation.plugin('html-webpack-plugin-alter-asset-tags', data => {
                    // console.log('html-webpack-plugin-alter-asset-tags');
                    // console.log(this.options);
                    // console.log(data);
                    // const htmlPromise = self.getFileData(data.outputName);
                    // htmlPromise.then(console.log);
                    let _outputName = data.outputName;
                    _outputName = this.options.env === 'production' ? _outputName.replace(/html\/build\//, '') : _outputName;
                    // console.log(_outputName);
                    const chunks = self.getFilePathByHtml(_outputName);
                    const resetTag = tag => {
                        const outputPath = path.dirname(_outputName);
                        tag.innerHTML = self.getFileData(path.join(outputPath, tag.assetUrl));
                        delete tag.assetUrl;
                        return tag;
                    };

                    data.head = data.head.concat(chunks.chunkHead.map(resetTag));
                    data.body = data.body.concat(chunks.chunkBody.map(resetTag));
                    // console.log(chunks.chunkHead);
                });

                // compilation.plugin('html-webpack-plugin-after-html-processing', (htmlPluginData, callback) => {
                //     console.log('html-webpack-plugin-after-html-processing');
                //     console.log(htmlPluginData.html);
                // });
                compilation.plugin('html-webpack-plugin-after-emit', data => {
                    // console.log('html-webpack-plugin-after-emit');
                    const outputHtmlPath = path.join(compilation.outputOptions.path, data.outputName);
                    // let _outputName = data.outputName;
                    // _outputName = this.options.env == 'production' ? _outputName.replace(/html\/build\//, '') : _outputName;
                    compiler.plugin('done', () => {
                        // console.log('html-webpack-inline-source-plugin done');
                        const html = self.deleteHtmlSource(data.html.source());
                        self.writeFileSyncHtml(outputHtmlPath, html);
                    });
                });
            });
        }
    }

    getFileData(filePath) {
        const _filePath = path.join(process.cwd(), filePath);
        // console.log(_filePath);
        if (fs.existsSync(_filePath)) {
            try {
                let fileData = fs.readFileSync(_filePath, 'utf-8');
                // fileData = UglifyJS(fileData).code;
                return fileData;
            } catch (err) {
                console.error('无法读取文件:' + _filePath);
                return '';
            }
        } else {
            console.error('文件不存在:' + _filePath);
        }
    }

    getFilePathByHtml(filePath) {
        let fileText = fs.readFileSync(path.join(process.cwd(), filePath), 'utf-8');
        let $ = cheerio.load(fileText);
        let chunkHead = [];
        let chunkBody = [];
        const backUrl = element => {
            const attrType = { script: 'src', link: 'href' };
            return element.attribs[attrType[element.name]];
        };
        const getTagsInfo = element => {
            const assetUrl = backUrl(element);
            const textType = {
                script: 'text/javascript',
                link: 'text/css'
            };
            return {
                assetUrl,
                tagName: element.name === 'link' ? 'style' : 'script',
                closeTag: true,
                attributes: {
                    type: textType[element.name] || ''
                }
            };
        };
        $('head [inline]').each((index, element) => {
            // console.log(element.name, element.type);
            if (element && element.name) chunkHead.push(getTagsInfo(element));
        });
        $('body [inline]').each((index, element) => {
            if (element && element.name) chunkBody.push(getTagsInfo(element));
        });

        return {
            chunkHead,
            chunkBody
        };
    }

    writeFileSyncHtml(filePath, html) {
        try {
            fs.writeFileSync(filePath, html);
        } catch (err) {
            console.error('无法修改文件:' + filePath);
        }
    }

    deleteHtmlSource(html) {
        let $ = cheerio.load(html);
        $('[inline]').remove();
        $('script[src]')
            .filter((i, el) => el.attribs.src.indexOf('@cdnhost') !== -1)
            .remove();
        return $.html();
    }
}

module.exports = HtmlWebpackInlineSourcePlugin;
