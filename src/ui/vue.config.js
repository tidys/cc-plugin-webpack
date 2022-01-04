const path = require('path')
module.exports = {
    pages: {
        index: {
            entry: path.resolve(__dirname, 'main.ts'),
            template: path.resolve(__dirname, 'index.html'),
            filename: 'index.html'
        }
    },
    chainWebpack: config => {
        config.resolve.extensions.add('.ts').add('.vue').add('.js').add('.json');
        // config.output.libraryExport('default').libraryTarget('commonjs')
        config.module
            .rule('ts')
            .test(/\.ts(x?)$/)
            .exclude.add(/node_modules/).end()
            .use('ts-loader')
            .loader('ts-loader')
            .options({
                onlyCompileBundledFiles: true,
                appendTsSuffixTo: ['\\.vue$'],
                compilerOptions: {
                    module: "commonjs",
                    allowSyntheticDefaultImports: true,
                    esModuleInterop: true,
                    noImplicitAny: false,
                    strict: false,
                    // "target": "esnext",
                    importHelpers: true,
                    // "experimentalDecorators": true,
                    skipLibCheck: true,
                }
            });
    }
}
