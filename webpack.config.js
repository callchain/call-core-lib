const path = require('path');

module.exports = {
  entry: './src/index.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    fallback: {
      "crypto": false,
      "stream": false,
      "util": false,
      "buffer": false,
      "assert": false,
    },
  },
  output: {
    filename: 'call-core-lib.min.js',
    path: path.resolve(__dirname, 'dist/browser'),
    library: 'CallCore',
    libraryTarget: 'umd',
    globalObject: 'this',
  },
  target: 'web',
  mode: 'production',
  optimization: {
    minimize: true,
  },
};
