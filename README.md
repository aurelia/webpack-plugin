# aurelia-webpack-plugin
Webpack plugin that creates a webpack context that Aurelia can use to dynamically load modules from.
This plugin is required for the aurelia-loader-webpack package to work properly (TODO: link).

## Installation

Install with npm (TODO)

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
