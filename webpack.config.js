var webpack = require('webpack'),
  path = require('path'),
  fs = require('fs'),
  CleanWebpackPlugin = require('clean-webpack-plugin').CleanWebpackPlugin,
  CopyWebpackPlugin = require('copy-webpack-plugin'),
  HtmlWebpackPlugin = require('html-webpack-plugin'),
  WriteFilePlugin = require('write-file-webpack-plugin');

// load the secrets

var fileExtensions = [
  'jpg',
  'jpeg',
  'png',
  'gif',
  'eot',
  'otf',
  'svg',
  'ttf',
  'woff',
  'woff2',
];

var nodeModules = {};
fs.readdirSync('node_modules')
  .filter(function (x) {
    return ['.bin'].indexOf(x) === -1;
  })
  .forEach(function (mod) {
    nodeModules[mod] = 'commonjs ' + mod;
  });

var options = {
  mode: 'none',
  optimization: {
    //minimize: true,
    //usedExports: 'global'
  },
  entry: {
    contentScript: path.join(__dirname, 'src', 'js', 'contentScript.js'),
    background: path.join(__dirname, 'src', 'js', 'background.js'),
    ui: path.join(__dirname, 'src', 'js', 'ui', 'index.js'),
  },
  output: {
    path: path.join(__dirname, 'build'),
    filename: '[name].bundle.js',
  },
  resolve: {
    alias: {
      'bn.js': path.resolve(
        __dirname,
        'node_modules',
        'bsv',
        'node_modules',
        'bn.js'
      ),
    },
    fallback: {
      assert: 'assert',
      process: 'process/browser',
      stream: 'stream-browserify',
    },
  },
  //externals: nodeModules,
  module: {
    rules: [
      {
        test: /\.(scss|css)$/,
        use: [
          // Creates `style` nodes from JS strings
          'style-loader',
          // Translates CSS into CommonJS
          'css-loader',
          // Compiles Sass to CSS
          'sass-loader',
        ],
      },
      {
        test: new RegExp('.(' + fileExtensions.join('|') + ')$'),
        exclude: /node_modules/,
        use: [
          {
            loader: 'file-loader?name=[name].[ext]',
          },
        ],
      },
      {
        test: /\.html$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'html-loader',
          },
        ],
      },
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/react', '@babel/env'],
          },
        },
      },
    ],
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser',
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_DEBUG': false,
      'process.env.NODE_ENV': "'production'",
      'process.browser': JSON.stringify(true),
    }),
    // clean the build folder
    new CleanWebpackPlugin(),
    // expose and write the allowed env vars on the compiled bundle
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/manifest.json',
          transform: function (content, path) {
            // generates the manifest file using the package.json informations
            return Buffer.from(
              JSON.stringify({
                description: process.env.npm_package_description,
                version: process.env.npm_package_version,
                ...JSON.parse(content.toString()),
              })
            );
          },
        },
        { from: 'src/img/icon-34.png', to: 'icon-34.png' },
        { from: 'src/img/icon-128.png', to: 'icon-128.png' },
      ],
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'html', 'popup.html'),
      filename: 'popup.html',
      chunks: ['ui'],
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'html', 'notification.html'),
      filename: 'notification.html',
      chunks: ['ui'],
    }),
    new WriteFilePlugin(),
  ],
};

module.exports = options;
