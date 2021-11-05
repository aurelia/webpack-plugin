const path = require('path');
const { AureliaPlugin } = require('aurelia-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (config) => {
  config.set({
    basePath: '',

    preprocessors: {
      // add webpack as preprocessor
      'test/**/*.test.ts': ['webpack', 'sourcemap']
    },

    // make sure to include webpack as a framework
    frameworks: ['mocha', 'webpack'],

    plugins: [
      'karma-mocha',
      'karma-webpack',
      'karma-chrome-launcher',
      'karma-sourcemap-loader',
    ],

    files: [
      // all files ending in ".test.js"
      // !!! use watched: false as we use webpacks watch
      { pattern: 'src/**/*.ts', included: false, served: true, watched: false, nocache: true },
      { pattern: 'test/**/*.test.ts', watched: false },
    ],

    browsers: ['ChromeHeadless'],
    mime: {
      "text/x-typescript": ["ts"]
    },
    mochaReporter: {
      ignoreSkipped: true
    },
    customLaunchers: {
      ChromeDebugging: {
        base: 'Chrome',
        flags: [
          '--remote-debugging-port=9333'
        ],
        debug: true
      }
    },

    webpack: webpackConfig(),
  });
}

/**
 * @returns {import('webpack').Configuration}
 */
function webpackConfig() {
  return {
    mode: 'development',
    // target: ['es5'],
    // output: {
    //   filename: 'app.js',
    //   path: path.join(os.tmpdir(), '_karma_webpack_') + Math.floor(Math.random() * 1000000),
    // },
    stats: {
      modules: false,
      colors: true,
    },
    resolve: {
      extensions: [".js", ".ts"],
      alias: {
        src: path.join(__dirname, 'src')
      },
      modules: ['node_modules']
    },
    watch: true,
    devtool: 'inline-source-map',
    optimization: {
      runtimeChunk: 'single',
      splitChunks: {
        chunks: 'all',
        minSize: 0,
        cacheGroups: {
          commons: {
            name: 'commons',
            chunks: 'initial',
            minChunks: 1,
          },
        },
      },
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          loader: "ts-loader",
          exclude: /node_modules/,
          options: {
            compilerOptions: {
              target: 'es5'
            }
          }
        },
        {
          test: /\.html$/,
          loader: 'html-loader'
        },
        {
          test: /\.css$/,
          issuer: { not: [ /.html$/i ] },
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader'
          ]
        }
      ]
    },
    plugins: [
      new AureliaPlugin({
        aureliaApp: undefined
      }),
      new MiniCssExtractPlugin()
    ],
  };
}
