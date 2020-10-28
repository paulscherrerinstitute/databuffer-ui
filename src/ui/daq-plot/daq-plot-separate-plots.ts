import {
	LitElement,
	css,
	customElement,
	html,
	property,
	query,
	PropertyValues,
} from 'lit-element'

import {
	dataSeries2HighchartsSeriesOptions,
	Highcharts,
	initChart,
	yAxis2HighchartsYAxisOptions,
} from './highcharts'
import { baseStyles } from '../shared-styles'
import { DaqPlotYAxis, DaqPlotDataSeries } from './types'

declare global {
	interface HTMLElementTagNameMap {
		'daq-plot-separate-plots': DaqPlotSeparatePlotsElement
	}
}

@customElement('daq-plot-separate-plots')
export class DaqPlotSeparatePlotsElement extends LitElement {
	@property({ type: String })
	title: string = ''

	@property({ type: String })
	subtitle: string = ''

	@property({ type: Array })
	yAxes: DaqPlotYAxis[] = []

	@property({ type: Array })
	series: DaqPlotDataSeries[] = []

	@query('#chartgroup')
	private chartgroupDiv!: HTMLDivElement

	private charts!: Highcharts.Chart[]

	private previousCount: number = 0

	updated(changedProperties: PropertyValues) {
		const opts: Highcharts.Options[] = []
		const currentCount = this.yAxes.length
		if (changedProperties.has('yAxes') || changedProperties.has('series')) {
			const tmpAxes = yAxis2HighchartsYAxisOptions(this.yAxes).map(
				y =>
					({
						...y,
						opposite: false,
						gridLineWidth: 1,
					} as Highcharts.YAxisOptions)
			)
			const tmpSeries = dataSeries2HighchartsSeriesOptions(this.series)
			for (let i = 0; i < currentCount; i++) {
				const series = tmpSeries
					.filter(s => s.yAxis === i)
					.map(s => ({ ...s, yAxis: 0 } as Highcharts.SeriesOptionsType))
				const o: Highcharts.Options = {
					yAxis: [tmpAxes[i]],
					series,
					credits: { enabled: false },
					legend: { enabled: false },
				}
				opts.push(o)
			}
		}
		if (currentCount !== this.previousCount) {
			// re-create all charts
			this.chartgroupDiv.innerHTML = '' // remove all children
			this.charts = []
			for (let i = 0; i < currentCount; i++) {
				const container = document.createElement('div')
				this.chartgroupDiv.appendChild(container)
				const chart = initChart(container)
				this.charts.push(chart)
			}
			this.updateComplete.then(() => {
				for (const c of this.charts) {
					c.reflow()
				}
			})
		}
		if (opts.length > 0) {
			for (let i = 0; i < currentCount; i++) {
				const chart = this.charts[i]
				const opt = opts[i]
				chart.update(opt, true, true)
			}
			this.updateComplete.then(() => {
				// Initially may show up as 600x400px, if it cannot pick up the
				// size of the container. Calling reflow() adjusts the size to
				// the container.
				//
				// see also https://stackoverflow.com/questions/16436666/highcharts-issue-about-full-chart-width
				for (const c of this.charts) {
					c.reflow()
				}
			})
		}
	}

	render() {
		return html`<div id="chartgroup"></div>`
	}

	static get styles() {
		return [
			baseStyles,
			css`
				:host {
					height: 100%;
					width: 100%;
				}
				#chartgroup {
					height: 100%;
					width: 100%;
					display: grid;
					grid-template-columns: 100%;
					grid-auto-rows: 1fr;
					grid-row-gap: 8px;
				}
				#chartgroup > div {
					min-height: 200px;
					border-radius: 2px;
					padding: 4px;
					box-shadow: rgba(0, 0, 0, 0.2) 0px 2px 4px -1px,
						rgba(0, 0, 0, 0.14) 0px 4px 5px 0px,
						rgba(0, 0, 0, 0.12) 0px 1px 10px 0px;
				}
			`,
		]
	}
}
