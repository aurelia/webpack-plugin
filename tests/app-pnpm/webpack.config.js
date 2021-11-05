const { AureliaPlugin } = require('aurelia-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

Error.stackTraceLimit = Infinity;

/**
 * @returns {import('webpack').Configuration}
 */
module.exports = (env = {}) => {
  return {
    mode: 'development',
    target: 'web',
    resolve: {
      extensions: [".ts", ".js"],
      modules: [
        // this is only needed inside for the tests in this repo
        // in normal application, can just use "src" instead of an absolute path to it
        path.resolve(__dirname, "src"),
        'node_modules'
      ]
    },
    entry: {
      // application entry file is app
      app: ["aurelia-bootstrapper"],
    },
    output: {
      // If production, add a hash to burst cache
      filename: '[name].js'
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          loader: 'ts-loader',
          exclude: /node_modules/
        },
        {
          test: /\.html$/,
          loader: 'html-loader'
        }
      ]
    },
    plugins: [
      new AureliaPlugin({
        aureliaConfig: ['basic'],
      }),
      // Standard plugin to build index.html
      new HtmlWebpackPlugin({
        template: 'index.ejs'
      })
    ]
  };
};
