var gulp = require('gulp');
var runSequence = require('run-sequence');
var to5 = require('gulp-babel');
var paths = require('../paths');
var compilerOptions = require('../babel-options');
var assign = Object.assign || require('object.assign');
var rename = require('gulp-rename');

var jsName = paths.packageName + '.js';

gulp.task('build-index', function(){
  return gulp.src(paths.root + 'index.js')
    .pipe(rename(jsName))
    .pipe(gulp.dest(paths.output));
});

gulp.task('build-es6', function () {
  return gulp.src(paths.output + jsName)
    .pipe(gulp.dest(paths.output + 'es6'));
});

gulp.task('build-commonjs', function () {
  return gulp.src(paths.output + jsName)
    .pipe(to5(assign({}, compilerOptions, {modules:'common'})))
    .pipe(gulp.dest(paths.output + 'commonjs'));
});

gulp.task('build-amd', function () {
  return gulp.src(paths.output + jsName)
    .pipe(to5(assign({}, compilerOptions, {modules:'amd'})))
    .pipe(gulp.dest(paths.output + 'amd'));
});

gulp.task('build-system', function () {
  return gulp.src(paths.output + jsName)
    .pipe(to5(assign({}, compilerOptions, {modules:'system'})))
    .pipe(gulp.dest(paths.output + 'system'));
});

gulp.task('build-dts', function(){
  return gulp.src(paths.output + paths.packageName + '.d.ts')
      .pipe(rename(paths.packageName + '.d.ts'))
      .pipe(gulp.dest(paths.output + 'es6'))
      .pipe(gulp.dest(paths.output + 'commonjs'))
      .pipe(gulp.dest(paths.output + 'amd'))
      .pipe(gulp.dest(paths.output + 'system'));
});

gulp.task('build', function(callback) {
  return runSequence(
    'clean',
    'build-index',
    ['build-es6', 'build-commonjs', 'build-amd', 'build-system'],
    'build-dts',
    callback
  );
});
