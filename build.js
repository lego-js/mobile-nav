var browserify = require('browserify');
var glob = require('glob');
var Server = require('karma').Server;
var vfs = require('vinyl-fs');
var source = require('vinyl-source-stream');
var watchify = require('watchify');
var args = require('yargs').argv;

function compile(entry) {
    var bundler = browserify({ entries: [entry], debug: true }).transform('babelify', { presets: ['es2015'] });

    var name = entry.split('/').pop();

    function rebundle() {
        bundler.bundle()
            .on('error', function(err) { console.error(err); this.emit('end'); })
            .pipe(source(name))
            .pipe(vfs.dest('./build'));
    }

    if (args.watch) {
        watchify(bundler).on('update', function() {
            console.log('-> bundling...');
            rebundle();
        });
    }

    rebundle();
}


glob('./src/es5-*.js', function(err, files) {
    if(err) return;
    files.map(compile);
});

new Server({
    configFile: __dirname + '/karma.conf.js',
    singleRun: !args.watch
}).start();