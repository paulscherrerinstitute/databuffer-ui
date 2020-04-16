import { describe, it } from 'mocha'
import { expect } from 'chai'

import { getShapeName, ShapeName, compareNameThenBackend } from './model'
import type { ChannelConfig } from './model'

const EXAMPLE_CHANNEL_CONFIG: ChannelConfig = {
	backend: 'b1',
	name: 'c1',
	description: 'example channel 1',
	source: 's1',
	type: 't1',
	unit: 'A',
	shape: [],
}

describe('channelsearch model', () => {
	describe('enum ShapeName', () => {
		it('ShapeName.SCALAR is correct', () => {
			expect(ShapeName.SCALAR).to.equal('scalar')
		})
		it('ShapeName.WAVEFORM is correct', () => {
			expect(ShapeName.WAVEFORM).to.equal('1d')
		})
		it('ShapeName.IMAGE is correct', () => {
			expect(ShapeName.IMAGE).to.equal('2d')
		})
	})

	describe('getShapeName', () => {
		it('throws error on 3d shape', () => {
			const c = { ...EXAMPLE_CHANNEL_CONFIG, shape: [5, 4, 3] }
			expect(() => getShapeName(c)).to.throw()
		})

		it('throws error on empty shape', () => {
			const c = { ...EXAMPLE_CHANNEL_CONFIG, shape: [] }
			expect(() => getShapeName(c)).to.throw()
		})

		it('returns ShapeName.IMAGE', () => {
			const c = { ...EXAMPLE_CHANNEL_CONFIG, shape: [2, 2] }
			expect(getShapeName(c)).to.equal(ShapeName.IMAGE)
		})

		it('returns ShapeName.WAVEFORM', () => {
			const c = { ...EXAMPLE_CHANNEL_CONFIG, shape: [2] }
			expect(getShapeName(c)).to.equal(ShapeName.WAVEFORM)
		})

		it('returns ShapeName.SCALAR', () => {
			const c = { ...EXAMPLE_CHANNEL_CONFIG, shape: [1] }
			expect(getShapeName(c)).to.equal(ShapeName.SCALAR)
		})
	})

	describe('compareNameThenBackend', () => {
		it('returns 0 on identic objects', () => {
			const a = EXAMPLE_CHANNEL_CONFIG
			const b = EXAMPLE_CHANNEL_CONFIG
			expect(a).to.equal(b) // strict equality = checks for object identity
			expect(compareNameThenBackend(a, b)).to.equal(0)
		})

		it('returns 0 on equal objects', () => {
			const a = EXAMPLE_CHANNEL_CONFIG
			const b = { ...EXAMPLE_CHANNEL_CONFIG }
			expect(a).not.to.equal(b) // strict equality = checks for object identity
			expect(a).to.deep.equal(b) // deep equality = checks for object equality
			expect(compareNameThenBackend(a, b)).to.equal(0)
		})

		it('returns 1 on a.name > b.name', () => {
			const a = { ...EXAMPLE_CHANNEL_CONFIG, name: 'z' }
			const b = { ...EXAMPLE_CHANNEL_CONFIG, name: 'a' }
			expect(compareNameThenBackend(a, b)).to.equal(1)
		})

		it('returns -1 on a.name < b.name', () => {
			const a = { ...EXAMPLE_CHANNEL_CONFIG, name: 'a' }
			const b = { ...EXAMPLE_CHANNEL_CONFIG, name: 'z' }
			expect(compareNameThenBackend(a, b)).to.equal(-1)
		})

		it('returns 1 on a.backend > b.backend', () => {
			const a = { ...EXAMPLE_CHANNEL_CONFIG, backend: 'z' }
			const b = { ...EXAMPLE_CHANNEL_CONFIG, backend: 'a' }
			expect(compareNameThenBackend(a, b)).to.equal(1)
		})

		it('returns -1 on a.backend < b.backend', () => {
			const a = { ...EXAMPLE_CHANNEL_CONFIG, backend: 'a' }
			const b = { ...EXAMPLE_CHANNEL_CONFIG, backend: 'z' }
			expect(compareNameThenBackend(a, b)).to.equal(-1)
		})

		it('compares name first, then backend', () => {
			const a = { ...EXAMPLE_CHANNEL_CONFIG, name: 'u', backend: 'z' }
			const b = { ...EXAMPLE_CHANNEL_CONFIG, name: 'v', backend: 'y' }
			// if backend is compared first, result will be 1
			// if name is compared first, result will be -1
			expect(a.name < b.name).to.be.true
			expect(a.backend > b.backend).to.be.true
			expect(compareNameThenBackend(a, b)).to.equal(-1)
		})
	})
})
