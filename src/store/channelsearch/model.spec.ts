import { describe, it } from 'mocha'
import { expect } from 'chai'

import { getShapeName, ShapeName } from './model'
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
})
