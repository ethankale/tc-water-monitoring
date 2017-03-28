var gulp = require('gulp');
var concat = require('gulp-concat');

gulp.task('scripts', function() {
  return gulp.src(['./js/selectsite.js', './js/map.js', './js/plot.js'])
    .pipe(concat('all.js'))
    .pipe(gulp.dest('./js/'));
});

gulp.task('default', function() {
  runSequence('scripts');
});


