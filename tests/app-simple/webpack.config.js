const { AureliaPlugin } = require('aurelia-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = (env = {}) => {
  const isProduction = env.prod === 'production';
  return {
    mode: isProduction ? 'production' : 'development',
    resolve: {
      extensions: [".ts", ".js"],
      modules: ["src", "node_modules"],
    },
    entry: {
      // application entry file is app and 
      app: ["aurelia-bootstrapper"],
    },
    output: {
      // If production, add a hash to burst cache
      filename: isProduction ? '[name].[hash].js' : '[name].js'
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: path.resolve(__dirname, 'node_modules')
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
      new AureliaPlugin(),
      // Standard plugin to build index.html
      new HtmlWebpackPlugin({
        template: 'index.ejs'
      }),
      new CopyWebpackPlugin([
        // Have all static files / asessts copied over
        { from: 'static/**', to: '.' },
        // Have base vendor css and javascript copied over
        { context: 'node_modules/jquery/dist', from: 'jquery.min.js', to: 'static/js' },
        { context: 'node_modules/bootstrap/dist/js', from: 'bootstrap.bundle.min.js', to: 'static/js' },
        { context: 'node_modules/bootstrap/dist/css', from: '**', to: 'static/css', ignore: '**.map' }
      ], {
          copyUnmodified: true
      }),
    ]
  };
};