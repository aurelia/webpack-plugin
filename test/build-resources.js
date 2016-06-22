var assert = require('chai').assert;
var path = require('path');
var fs = require('fs');
process.env.NODE_ENV = 'test';
// process.env.DEBUG = 'webpack-plugin';
var resolve = require('../dist/build-resources');

var filesExpectedToLoad = [
  'src/resources/local-resource.js',
  'src/resources/local-resource.html',
  'src/resources/extra-view-model.js',
  'src/resources/extra-view-model.js',
  'src/resources/extra-view.html',
  'src/resources/local-resource.js',
  'node_modules/external-2/resource.js',
  'node_modules/external-2/resource.js',
  'node_modules/external-2/sub/resource-from-package.js',
  'node_modules/external-2/sub/resource-from-package.js',
  'node_modules/external-2/resource.html',
  'node_modules/external-2/sub/resource-2.js',
  'node_modules/external/main.js',
  'node_modules/external/additional-mix.js',
  'node_modules/external/additional-mix.html',
  'node_modules/external/additional-mix-dependency.js',
  'node_modules/external/additional-mix-dependency.js',
  'node_modules/external/additional-mix-dependency-relative.js',
  'node_modules/external/additional-mix-dependency-relative.js',
  'node_modules/external/additional-mix.js',
  'node_modules/external/additional-mix-relative.js',
  'node_modules/external/additional-mix-relative.js',
  'node_modules/external/main.js',
  'external-3',
  'node_modules/external-3/dist/commonjs/resource.js',
  'node_modules/external-3/dist/commonjs/resource.html',
  'node_modules/external-3/dist/commonjs/sub/resource-3.js',
  'node_modules/external-3/dist/commonjs/sub/style.css',
  'node_modules/external-3/dist/commonjs/resource.js',
  'node_modules/external-3/dist/commonjs/sub/resource-4.js',
  'node_modules/external-3/dist/commonjs/sub/resource-4.js',
  'node_modules/external-3/dist/commonjs/sub/resource-5.html',
  'node_modules/external-3/dist/commonjs/sub/resource-6.js',
  'aurelia-framework',
  'node_modules/aurelia-templating-resources/dist/commonjs/compose.js',
  'node_modules/aurelia-templating-resources/dist/commonjs/compose.html',
  'node_modules/aurelia-templating-resources/dist/commonjs/compose.js',
  'node_modules/aurelia-templating-resources/dist/commonjs/sub/sub.js',
  'node_modules/aurelia-templating-resources/dist/commonjs/sub/sub.js',
  'src/c.js',
  'src/style.css',
  'src/d.js',
  'src/d.js',
  'src/style-b.css',
  'external',
  'node_modules/external/external-style.css'
];

var expectedRequireStrings = [
  'resources/local-resource',
  'resources/local-resource.html',
  './resources/extra-view-model',
  './resources/extra-view-model.js',
  './resources/extra-view.html',
  'resources/local-resource.js',
  'external-2/resource',
  'external-2/resource.js',
  'external-2/sub/resource-from-package',
  'external-2/sub/resource-from-package.js',
  'external-2/resource.html',
  'external-2/sub/resource-2.js',
  'external/main',
  'external/additional-mix',
  'external/additional-mix.html',
  'external/additional-mix-dependency',
  'external/additional-mix-dependency.js',
  'external/additional-mix-dependency-relative',
  'external/additional-mix-dependency-relative.js',
  'external/additional-mix.js',
  'external/additional-mix-relative',
  'external/additional-mix-relative.js',
  'external/main.js',
  'external-3',
  'external-3/resource',
  'external-3/resource.html',
  'external-3/dist/commonjs/sub/resource-3.js',
  'external-3/dist/commonjs/sub/style.css',
  'external-3/resource.js',
  'external-3/sub/resource-4',
  'external-3/sub/resource-4.js',
  'external-3/sub/resource-5.html',
  'external-3/dist/commonjs/sub/resource-6.js',
  'aurelia-framework',
  'aurelia-templating-resources/compose',
  'aurelia-templating-resources/compose.html',
  'aurelia-templating-resources/compose.js',
  'aurelia-templating-resources/sub/sub',
  'aurelia-templating-resources/sub/sub.js',
  'c.js',
  'style.css',
  './d',
  './d.js',
  './style-b.css',
  'external',
  'external/external-style.css'
];

describe('Dependency resolution', function () {
  
  it('resolves all dependencies', async function () {
    this.timeout(10000);
    const testPath = __dirname;
    const resolved = await resolve.processAll({
      src: path.join(testPath, 'src'),
      root: testPath
    })
    
    assert.isObject(resolved);
    
    var keys = Object.keys(resolved);
    var requireStrings = [];
    var filesLoaded = [];
    for (let key of keys) {
      /*
      if (resolved[key].startsWith('!!css!')) {
        assert.isTrue(key.endsWith('.css'));
      }
      */
      requireStrings.push(key);
      filesLoaded.push(resolved[key].source.replace(__dirname + path.sep, ''));
    }
    
    console.log(requireStrings)
    console.log(filesLoaded)
    
    assert.sameMembers(requireStrings, expectedRequireStrings);
    assert.sameMembers(filesLoaded, filesExpectedToLoad);
  });  
  
});
