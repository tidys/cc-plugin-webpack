import { CocosPluginManifest, CocosPluginOptions, PluginType } from './declare';

class Utils {
    private manifest: CocosPluginManifest | null = null;
    public options: CocosPluginOptions | null = null;
    private _init: boolean = false;
    // 内置的菜单
    public builtinMenu = {
        project: '',
        package: '',
    }

    init(manifest: CocosPluginManifest, options: CocosPluginOptions) {
        this._init = true;
        this.manifest = manifest;
        this.options = options;
        const { type } = options;
        if (type === PluginType.PluginV2) {
            this.builtinMenu.project = this.toi18n('MAIN_MENU.project.title')
            this.builtinMenu.package = this.toi18n('MAIN_MENU.package.title');
        } else if (type === PluginType.PluginV3) {
            this.builtinMenu.project = this.toi18n('menu.project')
        }
    }
    menuProject(name: string, i18n: boolean = true): string {
        if (!this._init) {
            console.error("need init");
            return "";
        }
        return `${utils.builtinMenu.project}/${i18n ? this.i18n(name) : name}`;
    }
    menuPackage(name: string, i18n: boolean = true): string {
        if (!this._init) {
            console.error("need init");
            return "";
        }
        return `${utils.builtinMenu.package}/${i18n ? this.i18n(name) : name}`;
    }
    i18n(key: string) {
        const pkgName = this.manifest!.name;
        return this.toi18n(`${pkgName}.${key}`);
    }

    toi18n(key: string) {
        return `i18n:${key}`;
    }
}

const utils = new Utils();
export default utils;
