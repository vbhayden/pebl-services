const path = require('path');

module.exports = {
    entry: './src/main.ts',
    // devtool: 'inline-source-map',
    module: {
	      rules: [
	          {
		            test:/\.tsx?$/,
		            use: 'ts-loader',
		            exclude: /node_modules/
	          }
	      ]
    },
    optimization: {
	      minimize: false
    },
    resolve: {
	      extensions: ['.tsx', '.ts', '.js']
    },
    output: {
	      filename: 'PeBLServices.js',
	      path: path.resolve(__dirname, 'dist')
    }
}
