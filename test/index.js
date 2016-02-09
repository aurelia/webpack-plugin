var expect = require('chai').expect;
var webpack = require('webpack');
var path = require('path');
var fs = require('fs');
var rm_rf = require('rimraf');
var AureliaWebpackPlugin = require('../');

var OUTPUT_DIR = path.join(__dirname, '../testoutput');

function testAureliaPlugin (webpackConfig, done) {

  webpack(webpackConfig, function (err, stats) {
    expect(err).to.be.falsy;
    var compilationErrors = (stats.compilation.errors || []).join('\n');
    var compilationWarnings = (stats.compilation.warnings || []).join('\n');
    done();
  });
}


describe('Aurelia webpack plugin', function () {
  
  beforeEach(function (done) {
    rm_rf(OUTPUT_DIR, done);
  });
  
  it('resolves modules with the default options', function (done) {
    testAureliaPlugin({
      entry: path.join(__dirname, 'src/main.js'),
      output: {
        path: OUTPUT_DIR,
        filename: 'bundle.js'
      },
      plugins: [
        new AureliaWebpackPlugin()
      ]      
    }, done);
  });
  
});