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
import { DaqPlotYAxis, DaqPlotDataSeries, DaqPlotDataPoint } from './types'

//#region Highcharts manipulations

// add type declaration for the internal method `searchPoint`
//
// see: https://www.highcharts.com/forum/viewtopic.php?t=42923
declare module 'highcharts' {
	interface Series {
		searchPoint: (
			event: Highcharts.PointerEventObject,
			flag: boolean
		) => Highcharts.Point
	}
}

// For synchronizing the charts' crosshairs we need to fix-up various
// Highcharts prototypes.
// (see https://www.highcharts.com/demo/synchronized-charts)
//
// **BUT**: As we use Highcharts in different parts of the app, we
// can't just leave it at that. We have to undo it after removing this
// type of element. Otherwise the change will affect charts in other
// elements as well.
let __orig_pointer_reset: typeof Highcharts.Pointer.prototype.reset | null =
	null

let __numConnectedElements = 0

function __change_highcharts_prototypes() {
	if (__orig_pointer_reset === null) {
		__orig_pointer_reset = Highcharts.Pointer.prototype.reset
		Highcharts.Pointer.prototype.reset = () => undefined
	}
}

function __revert_highcharts_prototypes() {
	if (__orig_pointer_reset === null) {
		throw new Error('__orig_pointer_reset is null')
	}
	// if (__orig_point_highlight === null) {
	// 	throw new Error('__orig_point_highlight is null')
	// }
	Highcharts.Pointer.prototype.reset = __orig_pointer_reset
	__orig_pointer_reset = null
	// Highcharts.Point.prototype.highlight = __orig_point_highlight
	// __orig_point_highlight = null
}

function __registerElem() {
	if (__numConnectedElements === 0) {
		__change_highcharts_prototypes()
	}
	__numConnectedElements++
}

function __unregisterElem() {
	__numConnectedElements--
	if (__numConnectedElements === 0) {
		__revert_highcharts_prototypes()
	}
}
//#endregion

/**
 * Highlight a single point on the chart.
 *
 * This is taken and adapted from the Highcharts example at
 * https://www.highcharts.com/demo/synchronized-charts
 *
 * The official example puts this as Highcharts.Point.prototype.highlight,
 * but if we keep it off the prototype, it cannot clash with potential
 * future developments of Highcharts.
 *
 * @param p The point to highlight
 * @param event The MouseEvent that triggered the highlighting
 */
function highlightPoint(p: Highcharts.Point, event: MouseEvent) {
	const ptrEvent = p.series.chart.pointer.normalize(event)
	p.onMouseOver() // Show the hover marker
	// NOTE: The example from the highcharts documentation has the following line
	//       but it keeps raising an error somewhere in the internals.
	//       The tooltip seems to be showing and refreshing just fine on its own.
	//       So for now, let's just leave it commented out.
	//this.series.chart.tooltip.refresh(this) // Show the tooltip
	p.series.chart.xAxis[0].drawCrosshair(ptrEvent, p) // Show the crosshair
}

// taken from the Highcharts demo and adapted
const syncExtremes: Highcharts.AxisSetExtremesEventCallbackFunction = function (
	this: Highcharts.Axis,
	e: Highcharts.AxisSetExtremesEventObject
) {
	// prevent feedback loop
	if (e.trigger === 'syncExtremes') return

	for (const chart of Highcharts.charts as Highcharts.Chart[]) {
		// skip the axis that triggered the synchronisation
		if (chart === this.chart) continue

		// setExtremes is null while updating
		if (chart.xAxis[0].setExtremes === null) continue

		chart.xAxis[0].setExtremes(e.min, e.max, undefined, false, {
			trigger: 'syncExtremes',
		})
	}
}

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

	@property({ type: Number })
	xMax?: number

	@property({ type: Number })
	xMin?: number

	@property({ type: Array })
	series: DaqPlotDataSeries[] = []

	@query('#chartgroup')
	private chartgroupDiv!: HTMLDivElement

	private charts!: Highcharts.Chart[]

	private previousCount: number = 0

	connectedCallback() {
		super.connectedCallback()
		__registerElem()
	}

	disconnectedCallback() {
		super.disconnectedCallback()
		__unregisterElem()
	}

	updated(changedProperties: PropertyValues) {
		let needsRefitXAxes = false
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
			needsRefitXAxes = true
		}
		if (changedProperties.has('xMax') || changedProperties.has('xMin')) {
			needsRefitXAxes = true
		}
		if (currentCount !== this.previousCount) {
			// re-create all charts
			this.chartgroupDiv.innerHTML = '' // remove all children
			this.charts = []
			for (let i = 0; i < currentCount; i++) {
				const container = document.createElement('div')
				this.chartgroupDiv.appendChild(container)
				const chart = initChart(container)
				Highcharts.addEvent(chart.xAxis[0], 'setExtremes', syncExtremes)
				this.charts.push(chart)
			}
			this.updateComplete.then(() => {
				for (const c of this.charts) {
					c.reflow()
				}
			})
			needsRefitXAxes = true
			this.previousCount = currentCount
		}
		if (needsRefitXAxes) this.refitXAxes()
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

	/**
	 * scale all X axes according to xMin and xMax
	 */
	private refitXAxes() {
		for (const chart of this.charts) {
			chart.xAxis[0].setExtremes(this.xMin, this.xMax)
		}
	}

	// taken from the Highcharts demo and adpated
	private chartMouseMove(e: MouseEvent) {
		for (const chart of this.charts) {
			// const chart = this.charts[i]
			if (chart === undefined) continue
			// Find coordinates within the chart
			const event = chart.pointer.normalize(e)
			// Get the hovered point
			const point = chart.series[0].searchPoint(event, true)

			if (point) {
				highlightPoint(point, e)
			}
		}
	}

	render() {
		return html`<div id="chartgroup" @mousemove=${this.chartMouseMove}></div>`
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
