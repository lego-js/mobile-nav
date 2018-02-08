const rollup = require('rollup');
const buble = require('rollup-plugin-buble');
const fs = require('fs');
const Server = require('karma').Server;
const sass = require('node-sass');
const chokidar = require('chokidar');
const args = require('yargs').argv;

async function build() {
    const jsInputConfig = {
        input: './src/index.js',
        plugins: [
            buble(),
        ],
        external: [
            'lego-data',
            'lego-toggle',
        ],
    };

    const jsOutputConfigCJS = {
        file: './dist/index.js',
        name: 'MobileNav',
        format: 'cjs',
        exports: 'named',
    };

    const jsOutputConfigIIFE = {
        file: './dist/es5-index.js',
        name: 'MobileNav',
        format: 'iife',
        globals: {
            'lego-data': 'window.legoJsData || {}',
            'lego-toggle': 'window.legoJsToggle || {}',
        },
    };

    if (args.watch) {
        rollup.watch(Object.assign(
            jsInputConfig,
            { output: jsOutputConfigCJS }
        )).on('event', async (event) => {
            if (event.code !== 'BUNDLE_END') return;
            const bundle = await rollup.rollup(jsInputConfig);
            await bundle.write(jsOutputConfigIIFE);
            console.log('Bundle compiled...');
        });
    } else {
        const bundle = await rollup.rollup(jsInputConfig);
        await bundle.write(jsOutputConfigCJS);
    }

    function buildSass() {
        sass.render({
            file: './src/index.scss',
        }, (error, result) => {
            if (!error) {
                fs.writeFile(`./dist/index.css`, result.css);
            }
        });
    }

    buildSass();

    if (args.watch) {
        chokidar.watch('./src/index.scss').on('change', file => {
            file && buildSass();
        });
    }

    new Server({
        configFile: __dirname + '/karma.conf.js',
        singleRun: !args.watch
    }).start();
}

build();
