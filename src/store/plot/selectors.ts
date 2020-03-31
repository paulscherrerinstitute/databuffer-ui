import { createSelector } from 'reselect'
import Highcharts from 'highcharts'
import { channelToId } from '@psi/databuffer-query-js/channel'
import {
	QueryResponseItem,
	Event,
	AggregationResult,
} from '@psi/databuffer-query-js/query-data'

import { RootState } from '../reducer'

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

const needsBinning = (item: QueryResponseItem): boolean => {
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
	'bin size: {point.eventCount}<br/>min: {point.min}<br/><b>mean: {point.mean}</b><br/>max: {point.max}'
const TOOLTIP_FORMAT_WITHOUT_BINNING =
	'bin size: {point.eventCount}<br/><b>value: {point.mean}</b>'

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
	(finishedAt, error) => finishedAt && !error
)

export const channelsWithoutData = createSelector([response], response =>
	response
		.filter((x: QueryResponseItem) => x.data.length === 0)
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
	}))
)

export const highchartsDataSeries = createSelector(
	[dataSeriesConfig, dataPoints],
	(dataSeriesConfig, dataPoints) =>
		dataSeriesConfig.map(cfg => ({
			name: cfg.name,
			type: 'line',
			step: 'left',
			yAxis: cfg.yAxisIndex,
			tooltip: dataPoints[cfg.channelIndex].needsBinning
				? TOOLTIP_FORMAT_WITH_BINNING
				: TOOLTIP_FORMAT_WITHOUT_BINNING,
			data: dataPoints[cfg.channelIndex].data,
		}))
)

export const highchartsOptions = createSelector(
	[highchartsYAxes, highchartsDataSeries],
	(yAxis, series) => ({
		yAxis,
		series,
	})
)
