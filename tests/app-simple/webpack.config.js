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
        path.resolve(__dirname, "src"),
        'node_modules'
      ],
      alias: {
        // src: path.resolve(__dirname, 'src'),
      }
    },
    entry: {
      // application entry file is app and 
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
          use: 'ts-loader',
          exclude: /node_modules/
        },
        {
          test: /\.html$/,
          loader: 'html-loader',
          options: {
            attrs: false
          }
        }
      ]
    },
    plugins: [
      new AureliaPlugin({
        dist: 'es2015',
        // aureliaApp: 'main',
        // aureliaConfig: ['basic'],
        // includeAll: 'src'
      }),
      // Standard plugin to build index.html
      new HtmlWebpackPlugin({
        template: 'index.ejs'
      }),
      // new CopyWebpackPlugin({
      //   patterns: [
      //     // Have all static files / asessts copied over
      //     { from: 'static/**', to: '.' },
      //   ],
      //   options: {
      //     // copyUnmodified: true
      //   }
      // }),
    ]
  };
};