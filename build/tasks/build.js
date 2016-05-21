var gulp = require('gulp');
var runSequence = require('run-sequence');
var to5 = require('gulp-babel');
var paths = require('../paths');
var compilerOptions = require('../babel-options');
var assign = Object.assign || require('object.assign');
var rename = require('gulp-rename');

gulp.task('build-commonjs', function () {
  return gulp.src(paths.root + '/*')
    .pipe(to5(assign({}, compilerOptions.commonjs())))
    .pipe(gulp.dest(paths.output));
});

gulp.task('build-dts', function(){
  return gulp.src(paths.output + paths.packageName + '.d.ts')
      .pipe(rename(paths.packageName + '.d.ts'))
      .pipe(gulp.dest(paths.output))
});

gulp.task('build', function(callback) {
  return runSequence(
    'clean',
    'build-commonjs',
    // 'build-dts',
    callback
  );
});
