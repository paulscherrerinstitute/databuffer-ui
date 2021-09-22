import Highcharts from 'highcharts'
import highchartsMore from 'highcharts/highcharts-more'
import {
	DataUiDataPoint,
	DataUiAggregatedValue,
	DataUiDataSeries,
} from '../../shared/dataseries'
import { PlotDataSeries } from '../../state/models/plot'
import { formatDate, TimeRange } from '../../util'
import type { DaqPlotDataSeries, DaqPlotYAxis } from './types'

// extend Highcharts with the "Highcharts More" module
// see https://www.highcharts.com/forum/viewtopic.php?t=35113
highchartsMore(Highcharts)

export function getColor(idx: number | undefined): string | undefined {
	if (idx === undefined) return undefined
	const colors = Highcharts.getOptions().colors
	if (colors) return colors[idx]
	return '#000000'
}

export function initChart(container: HTMLElement) {
	return Highcharts.chart(container, {
		chart: {
			events: {
				selection: (e: Highcharts.ChartSelectionContextObject): boolean => {
					// e.xAxis and e.yAxis are present when zooming
					// they are *not* present, when clicking "Reset zoom", but the handler will fire
					if (e.xAxis && e.yAxis) {
						const timeRange: TimeRange = {
							start: e.xAxis[0].min,
							end: e.xAxis[0].max,
						}
						const event = new CustomEvent<TimeRange>('highchartszoom', {
							composed: true,
							bubbles: true,
							cancelable: true,
							detail: timeRange,
						})
						const ret = container.dispatchEvent(event)
						return ret
					}
					// reset zoom has been clicked -- do nothing
					return true
				},
			},
			panKey: 'shift',
			panning: {
				enabled: true,
				type: 'xy',
			},
			zoomType: 'xy',
		},
		title: { text: '' },
		xAxis: {
			type: 'datetime',
			crosshair: true,
			startOnTick: false,
			endOnTick: false,
		},
		time: {
			useUTC: false,
		},
		tooltip: {
			useHTML: true,
			valueDecimals: 4,
			headerFormat:
				'<span style="font-size: 10px">{point.key}</span><table><tr><td>Series</td><td>Bin size</td><td>min</td><td>mean</td><td>max</td></tr>',
			footerFormat: '</table>',
			shared: true,
		},
	})
}

/** Map a YAxis object a Highcharts configuration */
export function yAxis2HighchartsYAxisOptions(yAxes: DaqPlotYAxis[]) {
	return yAxes.map((y, idx) => {
		const color = getColor(idx)
		const opts: Highcharts.YAxisOptions = {
			type: y.categories ? 'category' : y.type,
			categories: y.categories,
			min: y.min,
			max: y.max,
			opposite: y.side !== 'left',
			lineColor: color,
			labels: {
				format: `{value}${y.unit ? ' ' + y.unit : ''}`,
				style: { color },
			},
			title: {
				text: y.title,
				style: { color },
			},
			gridLineWidth: idx === 0 ? 1 : 0,
			startOnTick: false,
			endOnTick: false,
		}
		return opts
	})
}

const TOOLTIP_FORMAT_WITH_BINNING =
	'<tr><td style="color:{point.color}"><b>{series.name}</b></td><td>{point.binSize}</td><td>{point.min}</td><td><b>{point.mean}</b></td><td>{point.max}</td></tr>'
const TOOLTIP_FORMAT_WITHOUT_BINNING =
	'<tr><td style="color:{point.color}"><b>{series.name}</b></td><td></td><td></td><td><b>{point.mean}</b></td><td></td></tr>'

export function dataSeries2HighchartsSeriesOptions(
	dataSeries: PlotDataSeries[]
) {
	const result: Highcharts.SeriesOptionsType[] = []
	for (const ds of dataSeries) {
		const isBinned = ds.channel.dataType !== 'string'
		const color = getColor(ds.yAxisIndex)
		const opts: Highcharts.SeriesOptionsType = {
			name: ds.label,
			type: 'line',
			step: 'left',
			yAxis: ds.yAxisIndex,
			tooltip: {
				pointFormat: isBinned
					? TOOLTIP_FORMAT_WITH_BINNING
					: TOOLTIP_FORMAT_WITHOUT_BINNING,
			},
			color,
			zIndex: 1,
		}
		if (ds.datapoints) {
			if (ds.channel.dataType === 'string') {
				const categories = Array.from(new Set(ds.datapoints.map(pt => pt.y)))
				opts.data = (ds.datapoints as DataUiDataPoint<number, string>[]).map(
					pt => ({
						x: pt.x,
						y: categories.indexOf(pt.y),
					})
				)
			} else {
				opts.data = (
					ds.datapoints as DataUiDataPoint<number, DataUiAggregatedValue>[]
				).map(pt => ({
					x: pt.x,
					y: pt.y.mean,
					binSize: pt.y.count,
					min: pt.y.min,
					max: pt.y.max,
					mean: pt.y.mean,
				}))
			}
		}
		result.push(opts)
		if (!isBinned) continue
		result.push({
			name: `${ds.label} - min/max`,
			enableMouseTracking: false,
			type: 'arearange',
			step: 'left',
			yAxis: ds.yAxisIndex,
			linkedTo: ':previous',
			data: (
				ds.datapoints as DataUiDataPoint<number, DataUiAggregatedValue>[]
			).map(item => [item.x, item.y.min, item.y.max]),
			color,
			fillOpacity: 0.3,
			marker: { enabled: false },
			zIndex: 0,
		})
	}
	return result
}

export { Highcharts }
export default Highcharts
