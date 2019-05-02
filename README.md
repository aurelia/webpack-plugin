# aurelia-webpack-plugin

[![npm Version](https://img.shields.io/npm/v/aurelia-webpack-plugin.svg)](https://www.npmjs.com/package/aurelia-webpack-plugin)
[![Join the chat at https://gitter.im/aurelia/discuss](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/aurelia/discuss?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

This library is part of the [Aurelia](http://www.aurelia.io/) platform and contains a Webpack plugin designed to enable proper Webpack bundling.

> To keep up to date on [Aurelia](http://www.aurelia.io/), please visit and subscribe to [the official blog](http://blog.aurelia.io/) and [our email list](http://eepurl.com/ces50j). We also invite you to [follow us on twitter](https://twitter.com/aureliaeffect). If you have questions, please [join our community on Gitter](https://gitter.im/aurelia/discuss) or use [stack overflow](http://stackoverflow.com/search?q=aurelia). Documentation can be found [in our developer hub](http://aurelia.io/docs).

## Installation

Install with npm

```
npm install aurelia-webpack-plugin
```

## Usage

Add the plugin to the webpack config file:

```javascript
let { AureliaPlugin } = require('aurelia-webpack-plugin');
module.exports = {
  entry: 'aurelia-bootstrapper',
  output: {
    path: 'dist',
    filename: 'main.js'
  },
  plugins: [ new AureliaPlugin() ]
};
```
