# aurelia-webpack-plugin

[![npm Version](https://img.shields.io/npm/v/aurelia-webpack-plugin.svg)](https://www.npmjs.com/package/aurelia-webpack-plugin)
[![Discord Chat](https://img.shields.io/discord/448698263508615178.svg)](https://discord.gg/RBtyM6u)
[![CI](https://github.com/aurelia/webpack-plugin/actions/workflows/action.yml/badge.svg)](https://github.com/aurelia/webpack-plugin/actions/workflows/action.yml)

This library is part of the [Aurelia](http://www.aurelia.io/) platform and contains a Webpack plugin designed to enable proper Webpack bundling.

> To keep up to date on [Aurelia](http://www.aurelia.io/), please visit and subscribe to [the official blog](http://blog.aurelia.io/) and [our email list](http://eepurl.com/ces50j). We also invite you to [follow us on twitter](https://twitter.com/aureliaeffect). If you have questions, please [join our community on Discord](https://discord.gg/RBtyM6u) or use [stack overflow](http://stackoverflow.com/search?q=aurelia). Documentation can be found [in our developer hub](http://aurelia.io/docs).

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

## Documentation

Information about how to use this Webpack plugin can be found in [its Github wiki](https://github.com/aurelia/webpack-plugin/wiki).
