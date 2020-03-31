// avoid destructuring for older Node version support
const resolve = require('path').resolve;
const join = require('path').join;
const webpack = require('webpack');

const CONFIG = {
  mode: 'development',
  // bundle app.js and everything it imports, recursively.
  entry: {
    app: resolve('./public/kepler/src/main.js')
  },
  output: {
    path: resolve('./public/js'),
    filename: 'kepler.bundle.js'
  },

  devtool: 'source-map',

  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [join(__dirname, 'public/kepler/src')],
        exclude: [/node_modules/]
      },
      {
        // The example has some JSON data
        test: /\.json$/,
        loader: 'json-loader',
        exclude: [/node_modules/]
      }
    ]
  },

  node: {
    fs: 'empty'
  },

  // to support browser history api and remove the '#' sign
  devServer: {
    historyApiFallback: true
  }

};

// This line enables bundling against src in this repo rather than installed deck.gl module
module.exports = env => {
  return env ? require('../webpack.config.local')(CONFIG, __dirname)(env) : CONFIG;
};
