import { needsBinning } from './util'
import { DaqPlotDataPoint } from './types'

describe('module daq-plot/util', () => {
	describe('needsBinning', () => {
		let points: DaqPlotDataPoint[]

		beforeEach(() => {
			points = [
				{ x: 10, min: 100, mean: 100, max: 100, binSize: 1 },
				{ x: 20, min: 200, mean: 200, max: 200, binSize: 1 },
				{ x: 30, min: 300, mean: 300, max: 300, binSize: 1 },
			]
		})

		it('returns false for empty array', () => {
			expect(needsBinning([])).toBe(false)
		})

		it('returns false if all data points have bin size 1', () => {
			expect(needsBinning(points)).toBe(false)
		})

		it('returns false if just one data point has bin size >1', () => {
			for (let i = 0; i < points.length; i++) {
				const testData = [...points]
				testData[i].binSize = 2
				expect(needsBinning(testData)).toBe(true)
			}
		})
	})
})
