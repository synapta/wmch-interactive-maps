const path = require('path');

module.exports = {
  // bundle app.js and everything it imports, recursively.
  // mode: 'development',
  entry: {
    app: path.resolve('./public/kepler/src/main.js')
  },
  output: {
    filename: 'kepler.bundle.js',
    path: path.resolve('./public/js')
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: path.join(__dirname, 'public/kepler/src'),
        exclude: [/node_modules/]
      },
      {
        // JSON data
        test: /\.json$/,
        loader: 'json-loader',
        exclude: [/node_modules/]
      }
    ]
  },
  node: {
    fs: 'empty'
  }
};
