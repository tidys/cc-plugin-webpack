import { extname } from 'path';
import adaptation from '../adaptation/index';

export interface DropOptions {
    accept?: Accept[];
    multi?: boolean;
    ttf?: (name: string, data: ArrayBuffer) => void;
    texture?: (name: string, data: ArrayBuffer) => void;
    json?: (name: string, data: ArrayBuffer) => void;
}
export enum Accept {
    TTF = 'ttf',
    Texture = 'texture',
    JSON = 'json',
}
export class Drop {
    private map: Record<string, (name: string, data: ArrayBuffer) => void> = {};
    private options: DropOptions;
    constructor(options: DropOptions) {
        this.options = options;
        let { accept } = options;
        if (!accept) {
            accept = [];
            const keys = Object.keys(Accept);
            keys.forEach((key) => accept!.push(Accept[key]));

        }
        for (let i = 0; i < accept.length; i++) {
            switch (accept[i]) {
                case Accept.TTF: {
                    this.map['.ttf'] = this.dropFont.bind(this);
                    break;
                }
                case Accept.Texture: {
                    this.map['.png'] = this.dropTexture.bind(this);
                    this.map['.jpg'] = this.dropTexture.bind(this);
                    this.map['.jpeg'] = this.dropTexture.bind(this);
                    break;
                }
                case Accept.JSON: {
                    this.map['.json'] = this.dropJson.bind(this);
                    break;
                }
            }
        }
    }
    private tipsNotSupported(name: string) {
        adaptation.Dialog.message({
            type: 'warning',
            buttons: ['OK'],
            title: 'warn',
            message: `Unsupported file types:${name}`,
            noLink: true,
        });
    }
    private dropFont(name: string, data: ArrayBuffer) {
        const { ttf } = this.options;
        ttf && ttf(name, data);
    }
    private dropTexture(name: string, data: ArrayBuffer) {
        const { texture } = this.options;
        texture && texture(name, data);
    }
    private dropJson(name: string, data: ArrayBuffer) {
        const { json } = this.options;
        json && json(name, data);
    }
    private _onWebOne(itemFile: DataTransferItem) {
        if (itemFile.kind !== 'file') {
            return;
        }
        const entry = itemFile.webkitGetAsEntry();
        if (!entry) {
            return;
        }
        const { isFile, name } = entry;
        if (!isFile) {
            return;
        }
        const ext = extname(name);
        if (!ext) {
            return;
        }
        const cb = this.map[ext.toLocaleLowerCase()];
        if (!cb) {
            this.tipsNotSupported(name);
            return;
        }
        const file = itemFile.getAsFile();
        if (!file) { return; }
        const reader = new FileReader();
        reader.onload = (event) => {
            const data = event.target!.result;
            (async () => {
                cb(name, data as ArrayBuffer);
            })();
        };
        reader.readAsArrayBuffer(file);
    }
    public onWeb(event: DragEvent): void {
        if (!event.dataTransfer) {
            return;
        }
        const { items, files } = event.dataTransfer;
        if (!items || items.length <= 0) {
            // 暂时不处理非chrome环境
            return;
        }
        if (this.options.multi === true) {
            for (let i = 0; i < items.length; i++) {
                const itemFile = items[i];
                this._onWebOne(itemFile);
            }
        } else {
            const itemFile = items[0];
            this._onWebOne(itemFile);
        }
    }
    public onCreator(event: DragEvent): void {
        this.onWeb(event);
        return;
    }
}
