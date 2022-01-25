import {
	LitElement,
	PropertyValues,
	css,
	customElement,
	html,
	state,
	query,
} from 'lit-element'
import { isEmptyObj } from '../../util'

import { getColor, Highcharts } from './highcharts'
import { baseStyles } from '../shared-styles'
import { MinMax } from '../../shared/dataseries'

declare global {
	interface HTMLElementTagNameMap {
		'daq-index-plot': DaqIndexPlotElement
	}
}

@customElement('daq-index-plot')
export class DaqIndexPlotElement extends LitElement {
	@state()
	title: string = ''

	@state()
	subtitle: string = ''

	@state()
	xMax?: number

	@state()
	xMin?: number

	@state()
	rawData: number[] = []

	@state()
	envelopeCurve: MinMax[] = []

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
				type: 'linear',
			},
			tooltip: {
				enabled: false,
			},
			series: [
				{
					name: 'min/max in bin',
					type: 'arearange',
					step: 'left',
					color: getColor(0),
					fillOpacity: 0.3,
					zIndex: 0,
					data: this.envelopeCurve?.map((el, idx) => [idx, el.min, el.max]),
				},
				{
					name: 'raw waveform',
					type: 'line',
					step: 'left',
					color: getColor(1),
					zIndex: 1,
					data: this.rawData?.map((el, idx) => [idx, el]),
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
		if (changedProperties.has('xMax') || changedProperties.has('xMin')) {
			opts.xAxis = { min: this.xMin, max: this.xMax }
		}
		if (changedProperties.has('envelopeCurve')) {
			this.chart.series[0].setData(
				this.envelopeCurve?.map((el, idx) => [idx, el.min, el.max]),
				true,
				undefined,
				true
			)
		}
		if (changedProperties.has('rawData')) {
			this.chart.series[1].setData(
				this.rawData?.map((el, idx) => [idx, el]),
				true,
				undefined,
				true
			)
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
