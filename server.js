/* eslint-disable @typescript-eslint/no-var-requires */
// development server for the app project
// run with: npm start

const browserSync = require('browser-sync').create()
const historyApiFallback = require('connect-history-api-fallback')
const logger = require('connect-logger')
const compression = require('compression')
const zlib = require('zlib')
require('dotenv').config()

browserSync.init({
	cwd: 'public',
	server: {
		baseDir: 'public',
		index: 'index.html',
		routes: {
			'/src': './src/',
		},
	},
	files: ['scripts/**', 'index.html'],
	middleware: [
		logger(),
		compression({ level: zlib.constants.Z_BEST_COMPRESSION }),
		historyApiFallback(),
	],
	rewriteRules: [
		{
			match: /\$\{([A-Za-z0-9_]+)\}/g,
			fn: function (req, res, match) {
				const varName = match.substring(2, match.length - 1)
				return varName in process.env ? process.env[varName] : ''
			},
		},
	],
})
