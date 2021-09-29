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
import {
	DataUiAggregatedValue,
	DataUiDataPoint,
} from '../../../shared/dataseries'
import { formatDate } from '../../../util'
import { AppState } from '../../store'
import { NR_OF_BINS } from '../../../api/queryrest'

const getState = (state: AppState) => state.plot

export const plotVariation = createSelector(
	[getState],
	state => state.plotVariation
)
export const plotTitle = createSelector([getState], state => state.plotTitle)
export const startTime = createSelector([getState], state => state.startTime)
export const endTime = createSelector([getState], state => state.endTime)
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

export const plotQuery = createSelector(
	[channels, startTime, endTime],
	(channels, startTime, endTime) => {
		const query: DataQuery = {
			channels,
			range: {
				startSeconds: startTime / 1000,
				endSeconds: endTime / 1000,
			},
			eventFields: [
				EventField.GLOBAL_MILLIS,
				EventField.VALUE,
				EventField.EVENT_COUNT,
			],
			aggregation: {
				aggregationType: AggregationType.VALUE,
				aggregations: [
					AggregationOperation.MAX,
					AggregationOperation.MEAN,
					AggregationOperation.MIN,
				],
				nrOfBins: NR_OF_BINS,
			},
		}
		return query
	}
)

export const downloadQuery = createSelector(
	[channels, startTime, endTime, dialogDownloadAggregation],
	(channels, startTime, endTime, dialogDownloadAggregation) => {
		const query: DataQuery = {
			channels,
			range: {
				startSeconds: startTime / 1000,
				endSeconds: endTime / 1000,
			},
			eventFields: [
				EventField.GLOBAL_DATE,
				EventField.VALUE,
				EventField.EVENT_COUNT,
			],
			response: {
				format: DataResponseFormatType.CSV,
			},
			mapping: {
				alignment: MappingAlignment.BY_TIME,
			},
		}
		const aggregation: AggregationSpecification = {
			aggregationType: AggregationType.VALUE,
			aggregations: [
				AggregationOperation.MAX,
				AggregationOperation.MEAN,
				AggregationOperation.MIN,
			],
		}
		if (dialogDownloadAggregation === 'raw') {
			// do nothing
		} else if (dialogDownloadAggregation === 'as-is') {
			query.aggregation = { ...aggregation, nrOfBins: NR_OF_BINS }
		} else {
			query.aggregation = {
				...aggregation,
				durationPerBin: dialogDownloadAggregation,
			}
		}
		return query
	}
)

export const dialogDownloadCurlCommand = createSelector(
	[downloadQuery, startTime, endTime],
	(q, startTime, endTime) => {
		// for curl, replace millisecond timestamps with ISO strings
		q.range = {
			startDate: formatDate(startTime, 'T'),
			endDate: formatDate(endTime, 'T'),
		}
		return `curl -L -H 'Content-Type: application/json' -X POST -d '${JSON.stringify(
			q
		)}' ${window.DatabufferUi.QUERY_API}/query`
	}
)
