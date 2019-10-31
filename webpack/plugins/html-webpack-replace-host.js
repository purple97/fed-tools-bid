// const path = require('path');
// html-webpack-replace-host
// const _ = require('lodash');
const HtmlWebpackPlugin = require('html-webpack-plugin');
// const pluginName = 'html-webpack-replace-host';

class HtmlWebpackReplaceHost {
    constructor(options) {
        this.replacePluginInfo = options;
    }

    apply(compiler) {
        const self = this;
        // console.log(Object.keys(compiler), compiler.options);
        if (HtmlWebpackPlugin.getHooks) {
            compiler.hooks.compilation.tap('HtmlWebpackReplace', compilation => {
                HtmlWebpackPlugin.getHooks(compilation).alterAssetTagGroups.tapAsync('HtmlWebpackInjectorPlugin', (data, callback) => {
                    data.headTags = self._handleChunksConfig(data.headTags);
                    data.bodyTags = self._handleChunksConfig(data.bodyTags);
                    callback(null, data);
                });
            });
        } else {
            // HtmlWebpackPlugin version 3.2.0
            compiler.plugin('compilation', compilation => {
                compilation.plugin('html-webpack-plugin-alter-asset-tags', data => {
                    data.head = self._handleChunksConfig(data.head, data.plugin.options.version);
                    data.body = self._handleChunksConfig(data.body, data.plugin.options.version);
                    // console.log('html-webpack-replace-host');
                    // console.log(data.plugin.options.version);
                });
            });
        }
    }
    _handleChunksConfig(tags, version) {
        const _tags = [].concat(tags);
        // console.log('-----this.replacePluginInfo----', tags);
        if (this.replacePluginInfo) {
            _tags.map(tag => {
                if (tag.tagName === 'script' && tag.attributes) {
                    tag = this._setAttributesSrc(tag, this.replacePluginInfo.replaceString, version);
                }
                return tag;
            });
        }
        return _tags;
    }

    _setAttributesSrc(tag, replaceStr, version) {
        const regex = new RegExp(/^[../]*/);
        // console.log('---------', tag.attributes.src);
        if (tag.attributes.src && tag.attributes.src.match(regex)) {
            let _src = replaceStr
                ? tag.attributes.src.replace(regex, replaceStr)
                : tag.attributes.src.replace(regex, './').replace(/src\/[\w/]*\//, '');
            if (tag.attributes.src.match(/javascripts\/build\//)) {
                _src = _src.replace('javascripts/build/', '');
            }
            if (!_src.match(/\/[.\d]*/)) {
                _src = _src.replace(/\/index\.js/, '/' + version + '/index.js');
            }
            tag.attributes = Object.assign({}, tag.attributes, { src: _src });
        }
        return tag;
    }
}

module.exports = HtmlWebpackReplaceHost;
