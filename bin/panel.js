"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const declare_1 = require("./declare");
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
const html_webpack_plugin_1 = __importDefault(require("html-webpack-plugin"));
const const_1 = require("./chrome/const");
const log_1 = require("./log");
const analysis_1 = require("./analysis");
class Panel {
    constructor(service, webpackChain) {
        this.service = service;
        this.webpackChain = webpackChain;
    }
    getHtmlMinHash() {
        const ret = { min: false, hash: false };
        const { type } = this.service.projectConfig;
        if (type === declare_1.PluginType.Web) {
            ret.min = true;
            ret.hash = true;
        }
        else if (type === declare_1.PluginType.PluginV2 || type === declare_1.PluginType.PluginV3) {
            ret.min = false;
            ret.hash = false;
        }
        return ret;
    }
    dealPanel(panel, pluginOptions) {
        var _a;
        let ejsTemplate = null;
        if (panel.ejs && (0, fs_extra_1.existsSync)(panel.ejs)) {
            ejsTemplate = panel.ejs;
        }
        else if (this.service.isCreatorPluginV3()) {
            ejsTemplate = (0, path_1.join)(__dirname, '../template/panel-v3.ejs');
        }
        else if (this.service.isCreatorPluginV2()) {
            ejsTemplate = (0, path_1.join)(__dirname, '../template/panel-v2.ejs');
        }
        else if (this.service.isWeb()) {
            ejsTemplate = (0, path_1.join)(this.service.root, './template/web/index.html');
        }
        // let panelMain = panel.main.endsWith(".ts") ? panel.main : `${panel.main}.ts`;
        let mainFile = panel.main;
        if (!(0, fs_extra_1.existsSync)(mainFile)) {
            mainFile = (0, path_1.join)(this.service.context, panel.main);
            if (!(0, fs_extra_1.existsSync)(mainFile)) {
                log_1.log.red(`source file ${mainFile} not exist, please check your config file`);
                process.exit(1);
            }
        }
        if (ejsTemplate && (0, fs_extra_1.existsSync)(ejsTemplate) && (0, fs_extra_1.existsSync)(mainFile)) {
            let { webpackChain } = this;
            let entryName = 'default';
            if (this.service.isWeb() || this.service.isChromePlugin()) {
                entryName = panel.name;
            }
            if (this.service.isCreatorPlugin()) {
                entryName = `panel/${panel.name}`;
            }
            let entryPoint = webpackChain.entryPoints.get(entryName);
            if (entryPoint) {
                console.error(`has same entry ${entryName}`);
            }
            else {
                const filename = `${entryName}_panel.js`;
                const { min, hash } = this.getHtmlMinHash();
                let options = {
                    title: panel.title || panel.name,
                    template: ejsTemplate,
                    minify: min,
                    hash: hash,
                    chunks: ['vendor', entryName],
                };
                // creator插件必须有模板
                if (this.service.isCreatorPlugin()) {
                    options = Object.assign(options, {
                        filename,
                        inject: false,
                        ccPlugin: {
                            template: `<div id="app" style="width:100%;height:100%;display:flex;">${panel.name}</div>`,
                            style: '.body{width:100%}',
                            messages: 'hello message',
                        }
                    });
                }
                else {
                    let headers = this.getHeaders();
                    if ((_a = pluginOptions.server) === null || _a === void 0 ? void 0 : _a.https) {
                        headers.push(`<meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests"/>`);
                    }
                    headers = this.filterHead(headers);
                    options = Object.assign(options, {
                        ccPlugin: {
                            headers,
                        },
                        inject: true,
                        filename: `${entryName}.html`
                    });
                }
                if (panel.type === declare_1.Panel.Type.InnerIndex && panel.ejsOptions) {
                    options = Object.assign(options, panel.ejsOptions);
                }
                const hotFile = (0, path_1.join)(this.service.root, './src/ccp/client-socket.ts');
                webpackChain.entry(entryName).add(mainFile);
                webpackChain.plugin(entryName).use(html_webpack_plugin_1.default, [options]);
                return `${filename}`;
            }
        }
        return '';
    }
    getHeaders() {
        var _a, _b;
        let headers = [];
        if (!this.service.isWeb()) {
            return headers;
        }
        // 用户配置的head
        const webHead = ((_a = this.service.projectConfig.manifest.web) === null || _a === void 0 ? void 0 : _a.head) || [];
        headers = headers.concat(webHead);
        // 统计鸟的代码
        const id = ((_b = this.service.projectConfig.manifest.analysis) === null || _b === void 0 ? void 0 : _b.tongjiniao) || "";
        if (id) {
            const code = new analysis_1.Analysis(this.service).getTongJiNiaoCode(id);
            if (code) {
                headers.push(code);
            }
        }
        return headers;
    }
    // 过滤无效的head
    filterHead(headers) {
        headers = headers.filter(item => {
            item = item.trim();
            if (!item) {
                return false;
            }
            // 检查是否符合xml标签格式
            // <meta />
            const reg1 = new RegExp(/^<.*\/>$/);
            if (reg1.test(item)) {
                return true;
            }
            const reg2 = new RegExp(/^<.*>.*<.*\/.*>$/);
            if (reg2.test(item)) {
                return true;
            }
            log_1.log.red(`invalid header: ${item}`);
            return false;
        });
        return headers;
    }
    dealChrome() {
        const { chrome } = this.service.projectConfig.manifest;
        if (chrome) {
            // index索引界面
            const panels = [];
            const ejsOptions = JSON.stringify([
                const_1.ChromeConst.html.devtools,
                const_1.ChromeConst.html.options,
                const_1.ChromeConst.html.popup,
            ].map(item => {
                return {
                    label: `${item}`,
                    href: `${item}`,
                };
            }));
            // TODO: 未处理https，不过影响不大
            panels.push({
                name: 'index',
                title: "index",
                main: (0, path_1.join)(this.service.root, "src/index/index.ts"),
                ejs: (0, path_1.join)(this.service.root, "src/index/index.ejs"),
                ejsOptions: { panels: ejsOptions },
                type: declare_1.Panel.Type.InnerIndex,
            });
            // 各个界面
            [
                { name: const_1.ChromeConst.html.devtools, entry: chrome.view_devtools },
                { name: const_1.ChromeConst.html.options, entry: chrome.view_options },
                { name: const_1.ChromeConst.html.popup, entry: chrome.view_popup }
            ].map(item => {
                let name = item.name;
                const suffix = '.html';
                if (name.endsWith(suffix)) {
                    name = name.substring(0, name.length - suffix.length);
                }
                panels.push({
                    name: name,
                    title: name,
                    main: (0, path_1.join)(this.service.context, item.entry),
                    ejs: (0, path_1.join)(this.service.root, './template/web/index.html'),
                    type: declare_1.Panel.Type.Web,
                });
            });
            const options = this.service.projectConfig.options;
            // 主要是处理main的字段
            panels.forEach(panel => {
                // 需要知道这个面板被哪个HTMLWebpack chunk
                // creator插件需要知道面板对应的js，其他类型不需要
                panel.main = this.dealPanel(panel, options);
            });
            // 单独的脚本
            [
                { name: const_1.ChromeConst.script.content, entry: chrome.script_content },
                { name: const_1.ChromeConst.script.background, entry: chrome.script_background },
                { name: const_1.ChromeConst.script.inject, entry: chrome.script_inject },
            ].map(item => {
                const fullPath = (0, path_1.join)(this.service.context, item.entry);
                if (!(0, fs_extra_1.existsSync)(fullPath)) {
                    log_1.log.red(`not exist file: ${fullPath}`);
                    process.exit(0);
                }
                const name = (0, path_1.basename)(item.name);
                const ext = (0, path_1.extname)(item.name);
                const entry = name.substring(0, name.length - ext.length);
                this.webpackChain.entry(entry).add(fullPath);
            });
        }
    }
    dealPanels() {
        let panels = this.service.projectConfig.manifest.panels;
        const options = this.service.projectConfig.options;
        if (panels && panels.length) {
            if (this.service.isWeb()) {
                // 追加一个index页面，方便运行起来后，查看有多少个panel，也方便用户跳转
                const optionsPanels = JSON.stringify(panels.map((panel) => {
                    return {
                        label: `${panel.title}-${panel.name}`,
                        href: `${panel.name}.html`,
                    };
                }));
                panels.push({
                    name: 'index',
                    title: "index",
                    main: (0, path_1.join)(this.service.root, "src/index/index.ts"),
                    ejs: (0, path_1.join)(this.service.root, "src/index/index.ejs"),
                    ejsOptions: { panels: optionsPanels },
                    type: declare_1.Panel.Type.InnerIndex,
                });
            }
            // 主要是处理main的字段
            panels.forEach(panel => {
                // 需要知道这个面板被哪个HTMLWebpack chunk
                panel.main = this.dealPanel(panel, options);
            });
            return panels;
        }
    }
}
exports.default = Panel;
//# sourceMappingURL=panel.js.map