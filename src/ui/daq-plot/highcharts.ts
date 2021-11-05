import Highcharts from 'highcharts'
import highchartsMore from 'highcharts/highcharts-more'
import { DataUiDataPoint, DataUiAggregatedValue } from '../../shared/dataseries'
import { PlotDataSeries, YAxis } from '../../state/models/plot'
import { TimeRange } from '../../util'

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
			enabled: false,
		},
	})
}

/** Map a YAxis object a Highcharts configuration */
export function yAxis2HighchartsYAxisOptions(yAxes: YAxis[]) {
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
			color,
			zIndex: 1,
		}
		if (ds.datapoints) {
			if (ds.channel.dataType === 'string') {
				const categories = Array.from(new Set(ds.datapoints.map(pt => pt.y)))
				opts.data = (ds.datapoints as DataUiDataPoint<number, string>[]).map(
					pt => [pt.x, categories.indexOf(pt.y)]
				)
			} else {
				opts.data = (
					ds.datapoints as DataUiDataPoint<number, DataUiAggregatedValue>[]
				).map(pt => [pt.x, pt.y.mean])
			}
		}
		result.push(opts)
		if (!isBinned) continue
		// for binned data series, add a background band with min/max
		const minMaxSeries: Highcharts.SeriesOptionsType = {
			name: `${ds.label} - min/max`,
			enableMouseTracking: false,
			type: 'arearange',
			step: 'left',
			yAxis: ds.yAxisIndex,
			linkedTo: ':previous',
			color,
			fillOpacity: 0.3,
			marker: { enabled: false },
			zIndex: 0,
		}
		if (ds.datapoints) {
			const pts = ds.datapoints as DataUiDataPoint<
				number,
				DataUiAggregatedValue
			>[]
			minMaxSeries.data = pts.map(item => [item.x, item.y.min, item.y.max])
		}
		result.push(minMaxSeries)
	}
	return result
}

export { Highcharts }
export default Highcharts
