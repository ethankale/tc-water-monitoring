var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');

gulp.task('build', function() {
    return gulp.src(['./js/selectsite.js', './js/map.js', './js/plot.js'])
    .pipe(sourcemaps.init())
    .pipe(concat('all.js'))
    .pipe(uglify())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./js/'));
});


gulp.task('deploy', function() {
    return gulp.src(["./*"])
    .pipe(gulp.dest('\\\\rsh2o\\Web_Water-Monitoring\\'));
});


