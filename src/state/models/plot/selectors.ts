import { createSelector } from 'reselect'
import {
	DataQuery,
	EventField,
	AggregationType,
	AggregationOperation,
	DataResponseFormatType,
	AggregationSpecification,
	MappingAlignment,
} from '@paulscherrerinstitute/databuffer-query-js/api/v0/query-data'
import { channelToId } from '../../../shared/channel'
import { formatDate } from '../../../util'
import { AppState } from '../../store'
import { NR_OF_BINS } from '../../../api/queryapi'

const getState = (state: AppState) => state.plot

export const plotVariation = createSelector(
	[getState],
	state => state.plotVariation
)
export const plotTitle = createSelector([getState], state => state.plotTitle)
export const tooltipEnabled = createSelector(
	[getState],
	state => state.tooltipEnabled
)
export const startTime = createSelector([getState], state => state.startTime)
export const endTime = createSelector([getState], state => state.endTime)
export const queryExpansion = createSelector(
	[getState],
	state => state.queryExpansion
)
export const plotDataSeries = createSelector(
	[getState],
	state => state.dataSeries
)
export const channels = createSelector([plotDataSeries], series =>
	series.map(x => x.channel)
)
export const pendingRequests = createSelector(
	[plotDataSeries],
	series => series.filter(x => x.fetching).length
)
export const requestErrors = createSelector([plotDataSeries], series =>
	series.map(x => x.error)
)
export const anyRequestErrors = createSelector(
	[requestErrors],
	errors => errors.filter(Boolean).length > 0
)
export const allRequestsFinished = createSelector([plotDataSeries], series =>
	series.every(x => !x.fetching)
)
export const shouldDisplayChart = createSelector([plotDataSeries], series =>
	series.some(x => !x.fetching && x.error === undefined)
)
/** timestamp of first started request */
export const firstRequestSentAt = createSelector([plotDataSeries], series => {
	const times = series
		.map(x => x.requestSentAt)
		.filter(x => x !== undefined) as number[]
	if (times.length === 0) return undefined
	return Math.max(...times)
})
/** timestamp of last finished request */
export const lastRequestFinishedAt = createSelector(
	[plotDataSeries],
	series => {
		const times = series
			.map(x => x.requestFinishedAt)
			.filter(x => x !== undefined) as number[]
		if (times.length === 0) return undefined
		return Math.max(...times)
	}
)
export const totalRequestDuration = createSelector(
	[firstRequestSentAt, lastRequestFinishedAt],
	(firstRequestSentAt, lastRequestFinishedAt) =>
		firstRequestSentAt === undefined || lastRequestFinishedAt === undefined
			? undefined
			: lastRequestFinishedAt - firstRequestSentAt
)
export const plotSubTitle = createSelector(
	[lastRequestFinishedAt],
	requestFinishedAt =>
		requestFinishedAt ? `Data retrieved ${formatDate(requestFinishedAt)}` : ''
)

export const channelsWithoutData = createSelector([plotDataSeries], series =>
	series
		.filter(x => x.datapoints && x.datapoints.length === 0)
		.map(x => x.channel)
)

export const yAxes = createSelector([getState], state => state.yAxes)

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
	[
		plotDataSeries,
		yAxes,
		dialogShareLinkAbsoluteTimes,
		channels,
		startTime,
		endTime,
		queryExpansion,
		tooltipEnabled,
		plotTitle,
		plotVariation,
	],
	(
		series,
		yAxes,
		absTimes,
		channels,
		startTime,
		endTime,
		queryExpansion,
		tooltipEnabled,
		plotTitle,
		plotVariation
	) => {
		const params = channels
			.slice(0, 16)
			.map((ch, i) => `c${i + 1}=${encodeURIComponent(channelToId(ch))}`)
		series.slice(0, 16).forEach((x, i) => {
			if (x.label !== x.channel.name) {
				params.push(`l${i + 1}=${encodeURIComponent(x.label)}`)
			}
		})
		yAxes.slice(0, 16).forEach((x, i) => {
			if (x.type !== 'linear') {
				params.push(`y${i + 1}=${encodeURIComponent(x.type)}`)
			}
			if (x.min !== null) {
				params.push(`min${i + 1}=${encodeURIComponent(x.min.toString(10))}`)
			}
			if (x.max !== null) {
				params.push(`max${i + 1}=${encodeURIComponent(x.max.toString(10))}`)
			}
		})

		if (absTimes) {
			params.push(`startTime=${new Date(startTime).toISOString()}`)
			params.push(`endTime=${new Date(endTime).toISOString()}`)
		} else {
			params.push(`duration=${endTime - startTime}`)
		}
		params.push(`queryExpansion=${queryExpansion ? 1 : 0}`)
		params.push(`tooltipEnabled=${tooltipEnabled ? 1 : 0}`)
		if (plotTitle) {
			params.push(`title=${encodeURIComponent(plotTitle)}`)
		}
		if (plotVariation) {
			params.push(`plotVariation=${encodeURIComponent(plotVariation)}`)
		}
		return `${window.location.origin}/preselect?${params.join('&')}`
	}
)

export const dialogShareLinkChannelsTruncated = createSelector(
	[channels],
	channels => channels.length > 16
)

export const dialogDownloadShowing = createSelector(
	[getState],
	state => state.dialogDownloadShowing
)

export const dialogDownloadAggregation = createSelector(
	[getState],
	state => state.dialogDownloadAggregation
)

export const scalarChannels = createSelector([channels], channels =>
	channels.filter(c => c.dataShape === 'scalar' || c.dataType === 'string')
)
export const waveformChannels = createSelector([channels], channels =>
	channels.filter(c => c.dataShape === 'waveform' && c.dataType !== 'string')
)
export const imageChannels = createSelector([channels], channels =>
	channels.filter(c => c.dataShape === 'image')
)

export const csvDownloadPossible = createSelector(
	[scalarChannels],
	scalarChannels => scalarChannels.length > 0
)
export const csvDownloadChannelsSkipped = createSelector(
	[waveformChannels, imageChannels],
	(waveformChannels, imageChannels) =>
		waveformChannels.length > 0 || imageChannels.length > 0
)

export const csvStepSize = createSelector([dialogDownloadAggregation], aggr => {
	if (aggr === 'PT1H') return 3_600_000
	if (aggr === 'PT1M') return 60_000
	if (aggr === 'PT5S') return 5_000
	throw new Error('Invalid download aggregation')
})

export const csvFieldSeparator = createSelector(
	[getState],
	state => state.csvFieldSeparator
)

export const csvFieldQuotes = createSelector(
	[getState],
	state => state.csvFieldQuotes
)

export const csvLineTerminator = createSelector(
	[getState],
	state => state.csvLineTerminator
)
