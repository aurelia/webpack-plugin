# aurelia-webpack-plugin

[![ZenHub](https://raw.githubusercontent.com/ZenHubIO/support/master/zenhub-badge.png)](https://zenhub.io)
[![Join the chat at https://gitter.im/aurelia/discuss](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/aurelia/discuss?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

This library is part of the [Aurelia](http://www.aurelia.io/) platform and contains a Webpack plugin designed to enable proper Webpack bundling.

> To keep up to date on [Aurelia](http://www.aurelia.io/), please visit and subscribe to [the official blog](http://blog.durandal.io/). If you have questions, we invite you to [join us on Gitter](https://gitter.im/aurelia/discuss). If you would like to have deeper insight into our development process, please install the [ZenHub](https://zenhub.io) Chrome Extension and visit any of our repository's boards. You can get an overview of all Aurelia work by visiting [the framework board](https://github.com/aurelia/framework#boards).

## Installation

Install with npm

```
npm install aurelia-webpack-plugin
```

## Usage

Add the plugin to the webpack config file:

```javascript
var AureliaWebpackPlugin = require('aurelia-webpack-plugin');
var webpackConfig = {
  entry: 'index.js',
  output: {
    path: 'dist',
    filename: 'index_bundle.js'
  },
  plugins: [new AureliaWebpackPlugin()]
}
```

## Configuration options

The plugin accepts an options object with the following properties:

*src*

The directory where the app source files are located. Defaults to './src'.

*root*

The root project directory. Defaults to the directory from where webpack is called.

*includeSubModules*

Some Aurelia modules or plugins have more than 1 file that need to be resolved (for example, when a plugin also contains an html template).
By default, only the main file of a module is loaded. Adding this option allows you include extra files in the bundles.

```javascript
new AureliaWebpackPlugin({
  includeSubModules: [
    { moduleId: 'my-aurelia-plugin', include: /optional_regex/, exclude: /optional_regex/ }
  ]
})
``` 

Every module that needs extra files to be included is represented by one object in the array. 
The *moduleId* field is required and the *include* and *exclude* fields are optional.

> **Note**: internally, the includeSubModules feature is also used to resolve Aurelia's submodules in
aurelia-templating-resources and aurelia-templating-router. 

*contextMap*

By default, the plugin scans the dependencies in package.json and creates a map object with package name
as the key and the relative location of the main file from the project root.
```javascript
{
  "aurelia-bootstrapper": "node_modules/aurelia-bootstrapper/dist/commonjs/aurelia-bootstrapper.js",
  "aurelia-framework": "node_modules/aurelia-framework/dist/commonjs/aurelia-framework.js"
  ...
}
```
With the contextMap option, you can override this behavior and supply your own context map.

### Example configuration: custom app directory (other than './src')

```javascript
var path = require('path');
var AureliaWebpackPlugin = require('aurelia-webpack-plugin');
var webpackConfig = {
  entry: 'index.js',
  output: {
    path: 'dist',
    filename: 'index_bundle.js'
  },
  plugins: [
    new AureliaWebpackPlugin({
      src: path.resolve('./app');
    })
  ]
}
```

### Example configuration: lazy loading of modules

To enable lazy loading, you'll need to install webpack's bundle-loader:

```
npm install bundle-loader --save-dev
```

Now, you can prefix the src option with a bundle expression.

```javascript
var path = require('path');
var AureliaWebpackPlugin = require('aurelia-webpack-plugin');
var webpackConfig = {
  entry: 'index.js',
  output: {
    path: 'dist',
    filename: 'index_bundle.js'
  },
  plugins: [
    new AureliaWebpackPlugin({
      src: 'bundle?lazy!' + path.resolve('./src');
    })
  ]
}
```