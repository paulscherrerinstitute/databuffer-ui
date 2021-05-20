import { describe, it } from 'mocha'
import { expect } from 'chai'

import {
	formatDate,
	omitFromArray,
	timeRangeDay,
	timeRangeMonth,
	timeRangeWeek,
} from './util'

describe('module util.ts', () => {
	describe('formatDate', () => {
		it('should use the correct format', () => {
			const now = Date.now()
			expect(formatDate(now)).to.match(
				/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}$/
			)
		})

		it('should format a date in the local time zone', () => {
			// Date constructor will construct a date object assuming all values
			// are for the local time zone
			//
			// Note: Months are 0...11 (not 1...12)
			//
			// Note: We need up to 3 dates to check zero padding scenarios:
			//       - no padding
			//       - 1 zero
			//       - two zeroes (for msec))
			const d1 = new Date(2020, 1, 3, 9, 8, 7, 6)
			const d2 = new Date(2020, 11, 13, 19, 18, 17, 16)
			const d3 = new Date(2020, 11, 13, 19, 18, 17, 126)
			expect(formatDate(d1.getTime())).to.equal('2020-02-03 09:08:07.006')
			expect(formatDate(d2.getTime())).to.equal('2020-12-13 19:18:17.016')
			expect(formatDate(d3.getTime())).to.equal('2020-12-13 19:18:17.126')
		})
	})

	describe('omitFromArray', () => {
		it('returns empty array on empty array', () => {
			const input: string[] = []
			for (let i = 0; i < 3; i++) {
				expect(omitFromArray(input, i)).to.deep.equal(
					[],
					`Expected empty array for index=${i}`
				)
			}
		})

		it('returns complete copy of array on index >= length', () => {
			const input = [10, 20, 30, 40]
			expect(omitFromArray(input, input.length)).to.not.equal(input) // not the same array
			expect(omitFromArray(input, input.length)).to.deep.equal(input)
			expect(omitFromArray(input, input.length + 100)).to.deep.equal(input)
		})

		it('works with 0 <= index < length', () => {
			const input = [10, 20, 30, 40]
			expect(omitFromArray(input, 0)).to.deep.equal([20, 30, 40])
			expect(omitFromArray(input, 1)).to.deep.equal([10, 30, 40])
			expect(omitFromArray(input, 2)).to.deep.equal([10, 20, 40])
			expect(omitFromArray(input, 3)).to.deep.equal([10, 20, 30])
		})

		it('works with -length <= index < 0', () => {
			const input = [10, 20, 30, 40]
			expect(omitFromArray(input, -4)).to.deep.equal([20, 30, 40])
			expect(omitFromArray(input, -3)).to.deep.equal([10, 30, 40])
			expect(omitFromArray(input, -2)).to.deep.equal([10, 20, 40])
			expect(omitFromArray(input, -1)).to.deep.equal([10, 20, 30])
		})
	})

	describe('timeRangeDay', () => {
		it('sets the right start and end', () => {
			const referenceDate = new Date(2021, 4, 19, 12, 34, 56, 789).getTime()
			const expectedStart = new Date(2021, 4, 19, 0, 0, 0, 0).getTime()
			const expectedEnd = new Date(2021, 4, 19, 23, 59, 59, 999).getTime()
			const { start, end } = timeRangeDay(referenceDate)
			expect(start).to.equal(expectedStart)
			expect(end).to.equal(expectedEnd)
		})
	})

	describe('timeRangeMonth', () => {
		it('sets the right start and end', () => {
			const referenceDate = new Date(2021, 4, 19, 12, 34, 56, 789).getTime()
			const expectedStart = new Date(2021, 4, 1, 0, 0, 0, 0).getTime()
			// remember the Date constructor has 0-based months (0 == Jan, 1 == Feb, ... 11 == Dec)
			// so 4 == May --> last day in May == 31
			const expectedEnd = new Date(2021, 4, 31, 23, 59, 59, 999).getTime()
			const { start, end } = timeRangeMonth(referenceDate)
			expect(start).to.equal(expectedStart)
			expect(end).to.equal(expectedEnd)
		})
	})

	describe('timeRangeWeek', () => {
		it('sets the right start and end', () => {
			const referenceDate = new Date(2021, 4, 19, 12, 34, 56, 789).getTime()
			// 2021-05-19 is a Wednesday
			//   --> expectedStart = 2021-05-17 (Monday)
			//   --> expectedEnd = 2021-05-23 (Sunday)
			const expectedStart = new Date(2021, 4, 17, 0, 0, 0, 0).getTime()
			const expectedEnd = new Date(2021, 4, 23, 23, 59, 59, 999).getTime()
			const { start, end } = timeRangeWeek(referenceDate)
			expect(start).to.equal(expectedStart)
			expect(end).to.equal(expectedEnd)
		})
	})
})
