'use strict'

import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import replace from 'rollup-plugin-replace'
import minifyHTML from 'rollup-plugin-minify-html-literals'
import typescript from 'rollup-plugin-typescript'
import { terser } from 'rollup-plugin-terser'

import { version as pkgVersion } from './package.json'

// assume production mode for normal build, dev if watched
// flag is used to enable / disable HTML & JS minification
const production = !process.env.ROLLUP_WATCH
const appVersion = production
	? `v${process.env.APP_VERSION || pkgVersion}`
	: `v${process.env.APP_VERSION || pkgVersion}-dev`

export default {
	input: 'src/index.ts',
	output: {
		file: 'public/scripts/databuffer-ui.min.js',
		format: 'iife',
		name: 'DatabufferUi',
		sourcemap: true,
	},
	plugins: [
		replace({
			'process.env.NODE_ENV': JSON.stringify('production'),
			APP_VERSION_STRING: appVersion,
		}),
		resolve({
			dedupe: ['lit-html', 'lit-html/directives/unsafe-html', 'lit-element'],
		}),
		commonjs(),
		production && minifyHTML(),
		typescript({ typescript: require('typescript') }),
		production && terser(),
	],
	preserveSymlinks: true,
}
