"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const declare_1 = require("./declare");
class Utils {
    constructor() {
        this.manifest = null;
        this.options = null;
        this._init = false;
        // 内置的菜单
        this.builtinMenu = {
            project: '',
            package: '',
        };
    }
    init(manifest, options) {
        this._init = true;
        this.manifest = manifest;
        this.options = options;
        const { type } = options;
        if (type === declare_1.PluginType.PluginV2) {
            this.builtinMenu.project = this.toi18n('MAIN_MENU.project.title');
            this.builtinMenu.package = this.toi18n('MAIN_MENU.package.title');
        }
        else if (type === declare_1.PluginType.PluginV3) {
            this.builtinMenu.project = this.toi18n('menu.project');
        }
    }
    menuProject(name, i18n = true) {
        if (!this._init) {
            console.error("need init");
            return "";
        }
        return `${utils.builtinMenu.project}/${i18n ? this.i18n(name) : name}`;
    }
    menuPackage(name, i18n = true) {
        if (!this._init) {
            console.error("need init");
            return "";
        }
        return `${utils.builtinMenu.package}/${i18n ? this.i18n(name) : name}`;
    }
    i18n(key) {
        const pkgName = this.manifest.name;
        return this.toi18n(`${pkgName}.${key}`);
    }
    toi18n(key) {
        return `i18n:${key}`;
    }
}
const utils = new Utils();
exports.default = utils;
