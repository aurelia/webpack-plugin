var expect = require('chai').expect;
var webpack = require('webpack');
var path = require('path');
var fs = require('fs');
var rm_rf = require('rimraf');
var AureliaWebpackPlugin = require('../');

var OUTPUT_DIR = path.join(__dirname, '../testoutput');

describe('Aurelia webpack plugin', function () {
  
  beforeEach(function (done) {
    rm_rf(OUTPUT_DIR, done);
  });
  
  it('resolves modules with the default options', function (done) {
    var config = {
      target: 'async-node',
      entry: path.join(__dirname, 'src/main.js'),
      output: {
        path: OUTPUT_DIR,
        filename: 'bundle.js'
      },
      plugins: [
        new AureliaWebpackPlugin()
      ]      
    };
    
    webpack(config, function (err, stats) {
      expect(err).to.be.null;
      // Do not allow any errors, warnings are ok though
      expect(stats.hasErrors()).to.be.false;
      
      expect(fs.existsSync(path.join(OUTPUT_DIR, 'bundle.js'))).to.be.true;
      expect(fs.existsSync(path.join(OUTPUT_DIR, '0.bundle.js'))).to.be.true;
      
      done();
    });
  
  });  
  
});
