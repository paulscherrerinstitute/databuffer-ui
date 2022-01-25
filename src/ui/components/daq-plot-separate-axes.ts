import {
	LitElement,
	css,
	customElement,
	html,
	state,
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
import { isEmptyObj } from '../../util'
import { PlotDataSeries, YAxis } from '../../state/models/plot'

declare global {
	interface HTMLElementTagNameMap {
		'daq-plot-separate-axes': DaqPlotSeparateAxesElement
	}
}

@customElement('daq-plot-separate-axes')
export class DaqPlotSeparateAxesElement extends LitElement {
	@state()
	title: string = ''

	@state()
	subtitle: string = ''

	@state()
	yAxes: YAxis[] = []

	@state()
	xMax?: number

	@state()
	xMin?: number

	@state()
	series: PlotDataSeries[] = []

	@query('#chart')
	private chartDiv!: HTMLDivElement

	private chart?: Highcharts.Chart

	public zoomOut() {
		this.chart?.zoomOut()
	}

	public reflow() {
		this.chart?.reflow()
	}

	firstUpdated() {
		this.chart = initChart(this.chartDiv)
	}

	updated(changedProperties: PropertyValues) {
		const opts: Highcharts.Options = {}
		if (changedProperties.has('title')) {
			opts.title = { text: this.title }
		}
		if (changedProperties.has('subtitle')) {
			opts.subtitle = { text: this.subtitle }
		}
		if (changedProperties.has('yAxes')) {
			opts.yAxis = yAxis2HighchartsYAxisOptions(this.yAxes)
		}
		if (changedProperties.has('xMax') || changedProperties.has('xMin')) {
			opts.xAxis = { min: this.xMin, max: this.xMax }
		}
		if (changedProperties.has('series')) {
			opts.series = dataSeries2HighchartsSeriesOptions(this.series)
		}
		if (!isEmptyObj(opts as Record<string, unknown>)) {
			this.chart?.update(opts, true, true)
			// Initially may show up as 600x400px, if it cannot pick up the
			// size of the container. Calling reflow() adjusts the size to
			// the container.
			//
			// see also https://stackoverflow.com/questions/16436666/highcharts-issue-about-full-chart-width
			this.chart?.reflow()
		}
	}

	render() {
		return html`<div id="chart"></div>`
	}

	static get styles() {
		return [
			baseStyles,
			css`
				:host {
					height: 100%;
					width: 100%;
					border-radius: 2px;
					padding: 4px;
					box-shadow: rgba(0, 0, 0, 0.2) 0px 2px 4px -1px,
						rgba(0, 0, 0, 0.14) 0px 4px 5px 0px,
						rgba(0, 0, 0, 0.12) 0px 1px 10px 0px;
				}
				#chart {
					height: 100%;
					width: 100%;
				}
			`,
		]
	}
}
