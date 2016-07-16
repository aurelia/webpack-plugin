const loaderUtils = require('loader-utils');

module.exports = function(source, map) {
  const options = loaderUtils.parseQuery(this.query);
  const moduleId = options.moduleId;
  this.cacheable();

  const newSource = source + `
import {Origin as __au_o__} from 'aurelia-metadata';
for (var exportName in module.exports) {
  __au_o__.set(module.exports[exportName], new __au_o__(${JSON.stringify(moduleId)}, exportName));
}`;

  this.callback(null, newSource, map);

  if (options.debug) {
    console.log('changed source query', options);
  }
}
