var gulp = require('gulp');
var paths = require('../paths');

// outputs changes to files to the console
function reportChange(event) {
  console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
}

// this task will watch for changes and rebuild target as needed
gulp.task('watch', ['build-commonjs'], function() {
  gulp.watch(paths.source, ['build-commonjs']).on('change', reportChange);
});
