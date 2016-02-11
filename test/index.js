var expect = require('chai').expect;
var webpack = require('webpack');
var path = require('path');
var fs = require('fs');
var rm_rf = require('rimraf');
var AureliaWebpackPlugin = require('../');

var OUTPUT_DIR = path.join(__dirname, '../testoutput');

function testAureliaPlugin (webpackConfig, done) {

  
}

describe('Aurelia webpack plugin', function () {
  
  beforeEach(function (done) {
    //rm_rf(OUTPUT_DIR, done);
    done();
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
      expect(err).to.be.falsy;
      expect(stats.hasErrors()).to.be.falsy;
      expect(stats.hasWarnings()).to.be.falsy;
      
      expect(fs.existsSync(path.join(OUTPUT_DIR, '1.bundle.js'))).to.be.truthy;

      // todo try to require from bundle
      
      done();
    });
  
  });  
  
});