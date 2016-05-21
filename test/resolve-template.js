var assert = require('chai').assert;
var path = require('path');
var fs = require('fs');
var resolve = require('../src/resolve-template');

var filesExpectedToLoad = [
  'resources/local-resource.js',
  'resources/local-resource.html',
  'resources/extra-view-model.js',
  'resources/extra-view.html',
  'node_modules/external-2/sub/resource-2.js',
  'node_modules/external-2/resource.js',
  'node_modules/external-2/resource.html',
  'node_modules/external/additional-mix.js',
  'node_modules/external/additional-mix.html',
  'node_modules/external/additional-mix-dependency.js',
  'node_modules/external/additional-mix-dependency-relative.js',
  'bundle?lazy!node_modules/external/additional-mix-relative.js',
  'node_modules/external/main.js',
  'src/c.js',
  '!!raw!bundle?lazy&name=styles!src/style.css',
  'bundle?lazy!src/d.js',
  '!!raw!bundle?name=some-css!src/style-b.css',
  'bundle?lazy!external',
  '!!raw!node_modules/external/external-style.css'
];

var expectedRequireStrings = [
  './resources/local-resource',
  './resources/local-resource.html',
  './resources/extra-view-model',
  './resources/extra-view.html',
  './external-2/sub/resource-2',
  './external-2/resource',
  './external-2/resource.html',
  './external/additional-mix',
  './external/additional-mix.html',
  './external/additional-mix-dependency',
  './external/additional-mix-dependency-relative',
  './external/additional-mix-relative',
  './external/main',
  './c.js',
  './style.css',
  './d',
  './style-b.css',
  './external',
  './external/external-style.css'
];

describe('Dependency resolution', function () {
  
  it('resolves all dependencies', async function () {
    const resolved = await resolve.processAll({
      src: path.join(__dirname, 'src'),
      root: __dirname
    })
    
    assert.isObject(resolved);
    
    var keys = Object.keys(resolved);
    var requireStrings = [];
    var filesLoaded = [];
    for (let key of keys) {
      if (key.startsWith('!!raw!')) {
        assert.isTrue(resolved[key].endsWith('.css'));
      }
      requireStrings.push(resolved[key]);
      filesLoaded.push(key.replace(__dirname + path.sep, ''));
    }
    
    // console.log(requireStrings)
    // console.log(filesLoaded)
    
    assert.sameMembers(requireStrings, expectedRequireStrings);
    assert.sameMembers(filesLoaded, filesExpectedToLoad);
  });  
  
});
