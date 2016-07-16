const loaderUtils = require('loader-utils');

module.exports = function(source, map) {
  const options = loaderUtils.parseQuery(this.query);
  const moduleId = options.moduleId;
  this.cacheable();

  const newSource = source + `
import {ensureOriginOnExports as __au_ensure__} from 'aurelia-loader-webpack';
__au_ensure__(module.exports, ${JSON.stringify(moduleId)});`;

  this.callback(null, newSource, map);

  if (options.debug) {
    console.log('changed source query', options);
  }
}
