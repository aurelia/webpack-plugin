// With default aurelia-loader-webpack config, this module is added as an extra entry
// before any other code executes so that PAL.Loader is properly configured.
// There are several tricky points worth noticing.
// 
// We don't add aurelia-loader-webpack itself as an entry point (used to until 2.0 RC2)
// because it (transitively) brings too much bagage with itself, most notably polyfills.
// This made it super-hard to add other polyfills before Aurelia's and led to various bugs.
//
// We don't add custom code in aurelia-pal or aurelia-loader or aurelia-bootstrapper to detect
// the Webpack environment and configure the loader because they might live in a DLL.
// If they do, they would bring aurelia-loader-webpack along in the DLL and this is a special 
// library that *has to be in the main chunk.*
//
// The over-complicated design I've settled upon in the end is to use this special module
// as an entry point that configures aurelia-loader-webpack. It has minimal static imports:
// just aurelia-pal, which itself has no other dependencies and doesn't run much code.
// It hacks the loader field into a getter so that it can synchronously load aurelia-loader-webpack
// just in time when it is demanded by aurelia-bootstrapper.
// This enables users to load polyfills before aurelia-loader-webpack is actually loaded.

import { PLATFORM } from "aurelia-pal";

var Loader;

Object.defineProperty(PLATFORM, "Loader", {
  get: function() {
    return Loader || (Loader = require("aurelia-loader-webpack").WebpackLoader);
  },
  set: function(value) {
    Loader = value;
  }
});
