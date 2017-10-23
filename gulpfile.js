var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var pump = require('pump');

gulp.task('build', function(cb) {
    pump([ 
        gulp.src(['./bin-js/d3/d3.min.js', './bin-js/d3-legend/d3-legend.min.js',
            './bin-js/leaflet/leaflet.js', './bin-js/lodash/lodash.js',
            './js/selectsite.js', './js/map.js', './js/plot.js']),
        sourcemaps.init(),
        uglify(),
        concat('all.js'),
        sourcemaps.write('.'),
        gulp.dest('./js/'),
    ],
    cb
  );
});


gulp.task('deploy', function() {
    return gulp.src([
        "./js/*",
        "./css/*",
        //"./bin-js/**/*",
        "./img/marker/*.png",
        "./index.htm"], {base: "./"})
    .pipe(gulp.dest('\\\\rsh2o\\Web_Water-Monitoring\\'));
});

gulp.task('deploy-test', function() {
    return gulp.src([
        "./data/*",
        "./js/*",
        "./css/*",
        //"./bin-js/**/*",
        "./img/marker/*.png",
        "./index.htm"], {base: "./"})
    .pipe(gulp.dest('\\\\rsh2o\\Web_Water-Monitoring\\test\\'));
});


