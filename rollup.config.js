'use strict'

import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import replace from '@rollup/plugin-replace'
import minifyHTML from 'rollup-plugin-minify-html-literals'
import typescript from '@rollup/plugin-typescript'
import { terser } from 'rollup-plugin-terser'

// Is this build running inside a GitHub Actions workflow?
const github = process.env.GITHUB_ACTIONS
	? {
			ref: process.env.GITHUB_REF,
			sha: process.env.GITHUB_SHA,
			tag: /^refs\/tags\/v[0-9]+\.[0-9]+\.[0-9]+$/.test(process.env.GITHUB_REF)
				? process.env.GITHUB_REF.substr(10)
				: '',
	  }
	: undefined

// assume production mode for normal build, dev if watched
// flag is used to enable / disable HTML & JS minification
const production = github || !process.env.ROLLUP_WATCH

// which app version to display
const appVersion = github
	? github.tag
		? github.tag // use version from git tag, just in case package.json was not updated
		: `[edge version sha-${github.sha.substr(0, 8)}]`
	: `[local dev version]`

// which documentation / commits to reference
const gitRef = github && github.tag ? github.tag : 'master'

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
			APP_VERSION_STRING: appVersion,
			GIT_COMMIT_REF: gitRef,
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
