import { createSelector } from 'reselect'
import Highcharts from 'highcharts'
import { channelToId } from '@psi/databuffer-query-js/channel'
import type {
	DataResponseItem,
	Event,
	AggregationResult,
} from '@psi/databuffer-query-js/query-data'

import { RootState } from '../reducer'
import { formatDate } from '../../util'

const getState = (state: RootState) => state.plot

interface HighChartsDataPointWithBinning {
	x: number
	y: number
	eventCount: number
	min: number
	mean: number
	max: number
}

interface HighChartsDataPointWithoutBinning {
	x: number
	y: number
	eventCount: number
}

const needsBinning = (item: DataResponseItem): boolean => {
	if (item.data.length === 0) return false
	return item.data.some((x: Event): boolean => x.eventCount > 1)
}

const mapDataPointWithBinning = (
	dataPoint: Event
): HighChartsDataPointWithBinning => ({
	x: dataPoint.globalMillis,
	y: (dataPoint.value as AggregationResult).mean,
	eventCount: dataPoint.eventCount,
	min: (dataPoint.value as AggregationResult).min,
	mean: (dataPoint.value as AggregationResult).mean,
	max: (dataPoint.value as AggregationResult).max,
})
const mapDataPointWithoutBinning = (
	dataPoint: Event
): HighChartsDataPointWithoutBinning => ({
	x: dataPoint.globalMillis,
	y: (dataPoint.value as AggregationResult).mean,
	eventCount: dataPoint.eventCount,
})

const TOOLTIP_FORMAT_WITH_BINNING =
	'<tr><td style="color:{point.color}"><b>{series.name}</b></td><td>{point.eventCount}</td><td>{point.min}</td><td><b>{point.mean}</b></td><td>{point.max}</td></tr>'
const TOOLTIP_FORMAT_WITHOUT_BINNING =
	'<tr><td style="color:{point.color}"><b>{series.name}</b></td><td></td><td></td><td><b>{point.y}</b></td><td></td></tr>'

export const plotTitle = createSelector([getState], state => state.plotTitle)
export const startTime = createSelector([getState], state => state.startTime)
export const endTime = createSelector([getState], state => state.endTime)
export const channels = createSelector([getState], state => state.channels)
export const error = createSelector([getState], state => state.error)
export const fetching = createSelector([getState], state => state.fetching)
export const response = createSelector([getState], state => state.response)
export const requestSentAt = createSelector(
	[getState],
	state => state.request.sentAt
)
export const requestFinishedAt = createSelector(
	[getState],
	state => state.request.finishedAt
)
export const requestDuration = createSelector(
	[requestSentAt, requestFinishedAt],
	(sentAt, finishedAt) =>
		finishedAt && sentAt ? finishedAt - sentAt : undefined
)
export const shouldDisplayChart = createSelector(
	[requestFinishedAt, error],
	(finishedAt, error) => !!finishedAt && !error
)

export const channelsWithoutData = createSelector([response], response =>
	response
		.filter((x: DataResponseItem) => x.data.length === 0)
		.map(x => x.channel)
)

export const yAxes = createSelector([getState], state => state.yAxes)

export const dataSeriesConfig = createSelector(
	[getState],
	state => state.dataSeries
)

export const dataPoints = createSelector(
	[channels, response],
	(channels, response) =>
		channels.map(x => {
			const responseIndex = response.findIndex(
				item => channelToId(item.channel) === channelToId(x)
			)
			if (responseIndex === -1)
				return {
					responseIndex,
					needsBinning: false,
					data: [],
				}
			const responseItem = response[responseIndex]
			const binning = needsBinning(responseItem)
			const data = binning
				? responseItem.data.map(mapDataPointWithBinning)
				: responseItem.data.map(mapDataPointWithoutBinning)
			return {
				responseIndex,
				needsBinning: binning,
				data,
			}
		})
)

export const highchartsYAxes = createSelector([yAxes], yAxes =>
	yAxes.map((yaxis, idx) => ({
		labels: {
			format: `{value}${yaxis.unit ? ' ' + yaxis.unit : ''}`,
			style: { color: Highcharts.getOptions().colors[idx] },
		},
		title: {
			text: yaxis.title,
			style: { color: Highcharts.getOptions().colors[idx] },
		},
		opposite: yaxis.side !== 'left',
		min: yaxis.min,
		max: yaxis.max,
		type: yaxis.type,
	}))
)

export const highchartsDataSeries = createSelector(
	[dataSeriesConfig, dataPoints],
	(dataSeriesConfig, dataPoints) => {
		const result = []
		for (const cfg of dataSeriesConfig) {
			const series = {
				name: cfg.name,
				type: 'line',
				step: 'left',
				yAxis: cfg.yAxisIndex,
				tooltip: {
					pointFormat: dataPoints[cfg.channelIndex].needsBinning
						? TOOLTIP_FORMAT_WITH_BINNING
						: TOOLTIP_FORMAT_WITHOUT_BINNING,
				},
				data: dataPoints[cfg.channelIndex].data,
				color: Highcharts.getOptions().colors[cfg.yAxisIndex],
				zIndex: 1,
			}
			result.push(series)
			if (dataPoints[cfg.channelIndex].needsBinning) {
				const series = {
					name: `${cfg.name} - min/max`,
					enableMouseTracking: false,
					type: 'arearange',
					step: 'left',
					yAxis: cfg.yAxisIndex,
					tooltip: { enabled: false },
					linkedTo: ':previous',
					data: dataPoints[
						cfg.channelIndex
					].data.map((item: HighChartsDataPointWithBinning) => [
						item.x,
						item.min,
						item.max,
					]),
					color: Highcharts.getOptions().colors[cfg.yAxisIndex],
					fillOpacity: 0.3,
					marker: { enabled: false },
					zIndex: 0,
				}
				result.push(series)
			}
		}
		return result
	}
)

export const highchartsTitle = createSelector([plotTitle], plotTitle => ({
	text: plotTitle,
}))

export const highchartsSubTitle = createSelector(
	[requestFinishedAt],
	requestFinishedAt => ({
		text: requestFinishedAt
			? `Data retrieved ${formatDate(requestFinishedAt)}`
			: '',
	})
)

export const highchartsOptions = createSelector(
	[highchartsYAxes, highchartsDataSeries, highchartsTitle, highchartsSubTitle],
	(yAxis, series, title, subtitle) => ({
		yAxis,
		series,
		title,
		subtitle,
		tooltip: {
			useHTML: true,
			valueDecimals: 4,
			headerFormat:
				'<span style="font-size: 10px">{point.key}</span><table><tr><td>Series</td><td>Bin size</td><td>min</td><td>mean</td><td>max</td></tr>',
			fiiterFormat: '</table>',
		},
	})
)

export const queryRangeShowing = createSelector(
	[getState],
	state => state.queryRangeShowing
)

export const dialogShareLinkShowing = createSelector(
	[getState],
	state => state.dialogShareLinkShowing
)

export const dialogShareLinkAbsoluteTimes = createSelector(
	[getState],
	state => state.dialogShareLinkAbsoluteTimes
)

export const dialogShareLinkUrl = createSelector(
	[dialogShareLinkAbsoluteTimes, channels, startTime, endTime],
	(absTimes, channels, startTime, endTime) => {
		const params = channels
			.slice(0, 16)
			.map((ch, i) => `c${i + 1}=${encodeURIComponent(channelToId(ch))}`)
		if (absTimes) {
			params.push(`startTime=${startTime}`)
			params.push(`endTime=${endTime}`)
		} else {
			params.push(`duration=${endTime - startTime}`)
		}
		return `${window.location.origin}/preselect?${params.join('&')}`
	}
)

export const dialogShareLinkChannelsTruncated = createSelector(
	[channels],
	channels => channels.length > 16
)
