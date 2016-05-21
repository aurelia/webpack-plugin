var path = require('path');
var paths = require('./paths');

exports.base = function() {
  return {
    filename: '',
    filenameRelative: '',
    sourceMap: true,
    sourceRoot: '',
    moduleRoot: path.resolve('src').replace(/\\/g, '/'),
    moduleIds: false,
    comments: false,
    compact: false,
    code:true,
    presets: [ 'es2015-loose', 'stage-1'],
    plugins: [
      'syntax-async-functions',
      'syntax-flow',
      'transform-decorators-legacy',
      // ['babel-dts-generator', {
      //     packageName: paths.packageName,
      //     typings: '',
      //     suppressModulePath: true,
      //     suppressComments: false,
      //     memberOutputFilter: /^_.*/
      // }],
      'transform-flow-strip-types',
      'transform-runtime'
    ]
  };
}

exports.commonjs = function() {
  var options = exports.base();
  options.plugins.push('transform-es2015-modules-commonjs');
  return options;
};
