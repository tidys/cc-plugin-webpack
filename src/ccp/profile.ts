import {CocosPluginConfig, PluginType} from "../declare";

const Key = 'profile';

class Profile {
    data: Record<string, any> = {}
    pluginConfig: CocosPluginConfig | null = null;

    init(cfg: CocosPluginConfig) {
        this.pluginConfig = cfg;
    }

    load(url: string, cb: Function) {
        if (this.pluginConfig) {
            const { type } = this.pluginConfig.options;
            if (type === PluginType.Web) {
                // 从localstorage中读取
                const str = localStorage.getItem(Key);
                if (str) {
                    try {
                        this.data = JSON.parse(str);
                    } catch (e) {
                        return cb('parse data failed', this);
                    }
                }
                return cb(null, this);
            } else {
                // todo 调用编辑器接口
            }
        }
        return cb('profile not init!', this);
    }
}

export default new Profile();