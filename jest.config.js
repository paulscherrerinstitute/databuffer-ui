/** @type {import('@ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
	preset: 'ts-jest/presets/default-esm',
	globals: {
		'ts-jest': {
			useEMS: true,
		},
	},
	testEnvironment: 'node',
}
