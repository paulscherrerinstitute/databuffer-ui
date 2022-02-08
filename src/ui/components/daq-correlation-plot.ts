import { LitElement, PropertyValues, css, html } from 'lit'
import { customElement, query, state } from 'lit/decorators.js'
import { isEmptyObj } from '../../util'

import { getColor, Highcharts } from './highcharts'
import { baseStyles } from '../shared-styles'

declare global {
	interface HTMLElementTagNameMap {
		'daq-correlation-plot': DaqCorrelationPlotElement
	}
}

@customElement('daq-correlation-plot')
export class DaqCorrelationPlotElement extends LitElement {
	@state()
	title: string = ''

	@state()
	subtitle: string = ''

	@state()
	xAxisTitle: string = ''

	@state()
	yAxisTitle: string = ''

	@state()
	data: number[][] = []

	@query('#chart')
	private chartDiv!: HTMLDivElement

	private chart?: Highcharts.Chart

	firstUpdated() {
		this.chart = Highcharts.chart(this.chartDiv, {
			chart: {
				panKey: 'shift',
				panning: {
					enabled: true,
					type: 'xy',
				},
				zoomType: 'xy',
			},
			title: {
				text: this.title,
			},
			subtitle: {
				text: this.subtitle,
			},
			xAxis: {
				title: {
					text: this.xAxisTitle,
				},
			},
			yAxis: {
				title: {
					text: this.yAxisTitle,
				},
			},
			tooltip: {
				enabled: false,
			},
			series: [
				{
					name: 'correlation',
					type: 'scatter',
					color: getColor(1),
					data: this.data,
				},
			],
		})
	}

	updated(changedProperties: PropertyValues) {
		if (this.chart === undefined) return
		const opts: Highcharts.Options = {}
		if (changedProperties.has('title')) {
			opts.title = { text: this.title }
		}
		if (changedProperties.has('subtitle')) {
			opts.subtitle = { text: this.subtitle }
		}
		if (changedProperties.has('data')) {
			this.chart.series[0].setData(this.data, true, undefined, true)
		}
		if (!isEmptyObj(opts as Record<string, unknown>)) {
			this.chart.update(opts, true, true)
			// Initially may show up as 600x400px, if it cannot pick up the
			// size of the container. Calling reflow() adjusts the size to
			// the container.
			//
			// see also https://stackoverflow.com/questions/16436666/highcharts-issue-about-full-chart-width
			this.chart.reflow()
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
