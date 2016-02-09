
function loadModule(path) {
  return new Promise(function (resolve, reject) {
    try {
      require.ensure([], function (require) {
        var m = require('aurelia-loader-context/' + path);
        resolve(m);
      });
    } catch (e) {
      reject(e);
    }    
  });
}

module.exports = {
  loadModule: loadModule
}