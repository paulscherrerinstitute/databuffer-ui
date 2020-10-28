import Highcharts from 'highcharts'
import highchartsMore from 'highcharts/highcharts-more'
import type { DaqPlotDataSeries, DaqPlotYAxis } from './types'
import { needsBinning } from './util'

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
			// events: {
			// 	selection: (e: Highcharts.ChartSelectionContextObject): boolean => {
			// 		if (reloadOnZoom) {
			// 			this.__setTimeRange(e.xAxis[0].min, e.xAxis[0].max)
			// 			this.__plot()
			// 			return false
			// 		}
			// 		return true
			// 	},
			// },
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
			type: y.type,
			min: y.min,
			max: y.max,
			opposite: y.side !== 'left',
			lineColor: getColor(idx),
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
	dataSeries: DaqPlotDataSeries[]
) {
	const result: Highcharts.SeriesOptionsType[] = []
	for (const ds of dataSeries) {
		const isBinned = needsBinning(ds.data)
		const color = getColor(ds.yAxis)
		result.push({
			name: ds.name,
			type: 'line',
			step: 'left',
			yAxis: ds.yAxis,
			tooltip: {
				pointFormat: isBinned
					? TOOLTIP_FORMAT_WITH_BINNING
					: TOOLTIP_FORMAT_WITHOUT_BINNING,
			},
			data: ds.data.map(pt => ({ ...pt, y: pt.mean })),
			color,
			zIndex: 1,
		})
		if (!isBinned) continue
		result.push({
			name: `${ds.name} - min/max`,
			enableMouseTracking: false,
			type: 'arearange',
			step: 'left',
			yAxis: ds.yAxis,
			linkedTo: ':previous',
			data: ds.data.map(item => [item.x, item.min, item.max]),
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
