import { YAxis } from '../../state/models/plot/types'
import { yAxis2HighchartsYAxisOptions } from './highcharts'

describe('module daq-plot/highcharts', () => {
	describe('yAxis2HighchartsYAxisOptions', () => {
		let yAxes: YAxis[]

		beforeEach(() => {
			yAxes = [
				{
					title: 'a',
					unit: 'mA',
					side: 'left',
					min: null,
					max: null,
					type: 'linear',
				},
				{
					title: 'b',
					unit: '', // just a number, no unit
					side: 'right',
					min: 3,
					max: 7,
					type: 'logarithmic',
				},
			]
		})

		it('puts the unit into the label', () => {
			expect(yAxis2HighchartsYAxisOptions(yAxes)).toHaveProperty(
				'[0].labels.format',
				`{value} ${yAxes[0].unit}`
			)
			expect(yAxis2HighchartsYAxisOptions(yAxes)).toHaveProperty(
				'[1].labels.format',
				`{value}`
			)
		})

		it('puts the title into the title text', () => {
			expect(yAxis2HighchartsYAxisOptions(yAxes)).toHaveProperty(
				'[0].title.text',
				yAxes[0].title
			)
			expect(yAxis2HighchartsYAxisOptions(yAxes)).toHaveProperty(
				'[1].title.text',
				yAxes[1].title
			)
		})

		it('maps the side correctly', () => {
			expect(yAxis2HighchartsYAxisOptions(yAxes)).toHaveProperty(
				'[0].opposite',
				false
			)
			expect(yAxis2HighchartsYAxisOptions(yAxes)).toHaveProperty(
				'[1].opposite',
				true
			)
		})

		it('matches the colors of labels and title', () => {
			const labelColors = yAxis2HighchartsYAxisOptions(yAxes).map(
				x => x.labels?.style?.color
			)
			expect(yAxis2HighchartsYAxisOptions(yAxes)).toHaveProperty(
				'[0].title.style.color',
				labelColors[0]
			)
			expect(yAxis2HighchartsYAxisOptions(yAxes)).toHaveProperty(
				'[1].title.style.color',
				labelColors[1]
			)
		})

		it('sets min correctly', () => {
			expect(yAxis2HighchartsYAxisOptions(yAxes)).toHaveProperty(
				'[0].min',
				undefined
			)
			expect(yAxis2HighchartsYAxisOptions(yAxes)).toHaveProperty('[1].min', 3)
		})

		it('sets max correctly', () => {
			expect(yAxis2HighchartsYAxisOptions(yAxes)).toHaveProperty(
				'[0].max',
				undefined
			)
			expect(yAxis2HighchartsYAxisOptions(yAxes)).toHaveProperty('[1].max', 7)
		})

		it('sets type correctly', () => {
			expect(yAxis2HighchartsYAxisOptions(yAxes)).toHaveProperty(
				'[0].type',
				'linear'
			)
			expect(yAxis2HighchartsYAxisOptions(yAxes)).toHaveProperty(
				'[1].type',
				'logarithmic'
			)
		})
	})
})
