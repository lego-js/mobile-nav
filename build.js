const browserify = require('browserify');
const fs = require('fs');
const glob = require('glob');
const Server = require('karma').Server;
const sass = require('node-sass');
const vfs = require('vinyl-fs');
const source = require('vinyl-source-stream');
const chokidar = require('chokidar');
const watchify = require('watchify');
const args = require('yargs').argv;

function compile(entry) {
    const bundler = browserify({ entries: [entry], debug: true }).transform('babelify', { presets: ['es2015'] });

    const name = entry.split('/').pop();

    function rebundle() {
        bundler.bundle()
            .on('error', function(err) { console.error(err); this.emit('end'); })
            .pipe(source(name))
            .pipe(vfs.dest('./build'));
    }

    if (args.watch) {
        watchify(bundler).on('update', () => {
            console.log('-> bundling...');
            rebundle();
        });
    }

    rebundle();
}


glob('./src/es5-*.js', (error, files) => {
    if(error) return;
    files.map(compile);
});

function buildSass(file) {
    sass.render({
        file,
    }, (error, result) => {
        if (!error) {
            const name = file.substring(file.lastIndexOf('/'), file.lastIndexOf('.'));
            fs.writeFile(`./build/${name}.css`, result.css);
        }
    });
}

glob('./src/*.scss', (error, files) => {
    if(error) return;
    files.map(buildSass);
});

if (args.watch) {
    chokidar.watch('./src/*.scss').on('change', file => {
        if (file) {
            buildSass(file);
        }
    });
}

new Server({
    configFile: __dirname + '/karma.conf.js',
    singleRun: !args.watch
}).start();
