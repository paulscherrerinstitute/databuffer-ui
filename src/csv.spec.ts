import { describe, it } from 'mocha'
import { expect } from 'chai'

import { DEFAULT_OPTIONS, generateCsv, CsvDataSeries } from './csv'

describe('module csv.ts', () => {
	describe('generateCsv', () => {
		it('always has two rows of header', () => {
			const csv = generateCsv([])
			const rows = csv.split(DEFAULT_OPTIONS.rowSeparator)
			expect(rows.length).to.equal(2)
		})

		it('generates correct data series header', () => {
			const dataSeries: CsvDataSeries[] = [
				{ name: 'A', values: [] },
				{ name: 'B', values: [] },
				{ name: 'C', values: [] },
			]
			const csv = generateCsv(dataSeries, {
				...DEFAULT_OPTIONS,
				fieldQuote: '',
			})
			const firstRowText = csv.split(DEFAULT_OPTIONS.rowSeparator, 2)[0]
			const firstRowFields = firstRowText.split(DEFAULT_OPTIONS.fieldSeparator)
			expect(firstRowFields).to.deep.equal([
				'', // time
				'A', // name
				'', // skip 3
				'',
				'',
				'B', // name
				'', // skip 3
				'',
				'',
				'C',
				'',
				'',
				'',
			])
		})
		it('generates correct columns header', () => {
			const dataSeries: CsvDataSeries[] = [
				{ name: 'A', values: [] },
				{ name: 'B', values: [] },
				{ name: 'C', values: [] },
			]
			const csv = generateCsv(dataSeries, {
				...DEFAULT_OPTIONS,
				fieldQuote: '',
			})
			const secondRowText = csv.split(DEFAULT_OPTIONS.rowSeparator, 2)[1]
			const secondRowFields = secondRowText.split(
				DEFAULT_OPTIONS.fieldSeparator
			)
			const expectedFields = ['time']
			dataSeries.forEach(() =>
				expectedFields.push(...['events', 'min', 'mean', 'max'])
			)
			expect(secondRowFields).to.deep.equal(expectedFields)
		})
	})
})
