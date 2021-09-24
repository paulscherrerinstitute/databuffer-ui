import { createModel, RoutingState } from '@captaincodeman/rdx'
import Highcharts from 'highcharts'
import { createSelector } from 'reselect'
import {
	DataResponseItem,
	Event,
	AggregationResult,
	DataQuery,
	EventField,
	AggregationType,
	AggregationOperation,
	DataResponseFormatType,
	AggregationSpecification,
	MappingAlignment,
} from '@paulscherrerinstitute/databuffer-query-js/api/v0/query-data'
import { DataResponse, NR_OF_BINS, queryRestApi } from '../../../api/queryrest'
import { EffectsStore, AppState, AppDispatch } from '../../store'
import { formatDate } from '../../../util'
import FileSaver from 'file-saver'
import { ROUTE } from '../../routing'
import {
	DaqPlotDataPoint,
	DaqPlotDataSeries,
	DaqPlotYAxis,
} from '../../../ui/daq-plot/types'
import { DaqPlotConfig } from '../../../ui/daq-plot/types'
import { make_debug, make_error, make_info } from '../applog'
import { channelToId, DataUiChannel } from '../../../shared/channel'
import {
	DataUiAggregatedValue,
	DataUiDataPoint,
	DataUiDataSeries,
} from '../../../shared/dataseries'

import {
	DownloadAggregation,
	PlotState,
	PlotVariation,
	YAxisType,
} from './types'
import { handleRoutePreselect } from './preselect'

// helper functions
const findIndexOfChannel = (state: PlotState, ch: DataUiChannel): number =>
	state.dataSeries.findIndex(
		e => e.channel.backend === ch.backend && e.channel.name === ch.name
	)

const isChannelSelected = (state: PlotState, ch: DataUiChannel): boolean =>
	findIndexOfChannel(state, ch) >= 0

export const plot = createModel({
	state: {
		plotVariation: PlotVariation.SeparateAxes,
		plotTitle: '',
		startTime: Date.now() - 60_000,
		endTime: Date.now(),
		channels: [],
		dataRequests: [],
		yAxes: [],
		dataSeries: [],
		queryRangeShowing: false,
		dialogShareLinkShowing: false,
		dialogShareLinkAbsoluteTimes: true,
		dialogDownloadShowing: false,
		dialogDownloadAggregation: 'as-is',
	} as PlotState,
	reducers: {
		selectChannel(state, channel: DataUiChannel) {
			return isChannelSelected(state, channel)
				? state
				: {
						...state,
						yAxes: [
							...state.yAxes,
							{
								title: channel.name,
								unit: channel.unit || '',
								side: state.yAxes.length % 2 === 0 ? 'left' : 'right',
								min: null,
								max: null,
								type: 'linear',
							},
						],
						dataSeries: [
							...state.dataSeries,
							{
								channel,
								label: channel.name,
								yAxisIndex: state.yAxes.length,
							},
						],
				  }
		},

		unselectChannel(state, index: number) {
			const dataSeries = [...state.dataSeries]
			dataSeries.splice(index, 1)
			const yAxes = [...state.yAxes]
			yAxes.splice(index, 1)
			for (let i = index; i < yAxes.length; i++) {
				yAxes[i].side = i % 2 === 0 ? 'left' : 'right'
			}
			return {
				...state,
				dataSeries,
				yAxes,
			}
		},

		setSelectedChannels(state, channels: DataUiChannel[]) {
			return {
				...state,
				dataSeries: channels.map((channel, idx) => ({
					channel,
					label: channel.name,
					yAxisIndex: idx,
				})),
				yAxes: channels.map((ch, idx) => ({
					title: ch.name,
					side: idx % 2 === 0 ? 'left' : 'right',
					unit: ch.unit || '',
					min: null,
					max: null,
					type: 'linear',
				})),
			}
		},

		changePlotVariation(state, plotVariation: PlotVariation) {
			return {
				...state,
				plotVariation,
			}
		},

		changePlotTitle(state, plotTitle: string) {
			return {
				...state,
				plotTitle,
			}
		},

		changeDataSeriesLabel(state, payload: { index: number; label: string }) {
			return {
				...state,
				dataSeries: state.dataSeries.map((series, idx) =>
					idx !== payload.index ? series : { ...series, name: payload.label }
				),
				yAxes: state.yAxes.map((axis, idx) =>
					idx !== payload.index ? axis : { ...axis, title: payload.label }
				),
			}
		},

		changeStartTime(state, startTime: number) {
			return {
				...state,
				startTime,
			}
		},

		changeEndTime(state, endTime: number) {
			return {
				...state,
				endTime,
			}
		},

		drawPlotRequest(state, payload: { index: number; timestamp: number }) {
			const { index, timestamp } = payload
			const dataSeries = [...state.dataSeries]
			dataSeries[index] = {
				...dataSeries[index],
				fetching: true,
				error: undefined,
				requestSentAt: timestamp,
				requestFinishedAt: undefined,
				datapoints: undefined,
			}
			return {
				...state,
				dataSeries,
			}
		},

		drawPlotSuccess(
			state,
			payload: {
				index: number
				timestamp: number
				datapoints: DataUiDataPoint<number, unknown>[]
			}
		) {
			const { index, timestamp, datapoints } = payload
			const dataSeries = [...state.dataSeries]
			dataSeries[index] = {
				...dataSeries[index],
				fetching: false,
				requestFinishedAt: timestamp,
				datapoints: datapoints,
			}
			return {
				...state,
				dataSeries,
			}
		},

		drawPlotFailure(
			state,
			payload: { index: number; timestamp: number; error: Error }
		) {
			const { index, timestamp, error } = payload
			const dataSeries = [...state.dataSeries]
			dataSeries[index] = {
				...dataSeries[index],
				fetching: false,
				requestFinishedAt: timestamp,
				error,
			}
			return {
				...state,
				dataSeries,
			}
		},

		toggleQueryRange(state) {
			return {
				...state,
				queryRangeShowing: !state.queryRangeShowing,
			}
		},

		hideQueryRange(state) {
			return {
				...state,
				queryRangeShowing: false,
			}
		},

		showQueryRange(state) {
			return {
				...state,
				queryRangeShowing: true,
			}
		},

		showShareLink(state) {
			return {
				...state,
				dialogShareLinkShowing: true,
			}
		},

		hideShareLink(state) {
			return {
				...state,
				dialogShareLinkShowing: false,
			}
		},

		shareAbsoluteTimes(state) {
			return {
				...state,
				dialogShareLinkAbsoluteTimes: true,
			}
		},

		shareRelativeTimes(state) {
			return {
				...state,
				dialogShareLinkAbsoluteTimes: false,
			}
		},

		setAxisMin(state, payload: { index: number; min: number | null }) {
			return {
				...state,
				yAxes: state.yAxes.map((axis, index) =>
					index !== payload.index ? axis : { ...axis, min: payload.min }
				),
			}
		},

		setAxisMax(state, payload: { index: number; max: number | null }) {
			return {
				...state,
				yAxes: state.yAxes.map((axis, index) =>
					index !== payload.index ? axis : { ...axis, max: payload.max }
				),
			}
		},

		setAxisType(state, payload: { index: number; type: YAxisType }) {
			return {
				...state,
				yAxes: state.yAxes.map((axis, index) =>
					index !== payload.index ? axis : { ...axis, type: payload.type }
				),
			}
		},

		showDownload(state) {
			return {
				...state,
				dialogDownloadShowing: true,
			}
		},

		hideDownload(state) {
			return {
				...state,
				dialogDownloadShowing: false,
			}
		},

		setDownloadAggregation(state, aggregation: DownloadAggregation) {
			return {
				...state,
				dialogDownloadAggregation: aggregation,
			}
		},
	},

	effects(store: EffectsStore) {
		const dispatch = store.getDispatch()
		return {
			async drawPlot() {
				const channels = plotSelectors.channels(store.getState())
				const startDate = new Date(
					plotSelectors.startTime(store.getState())
				).toISOString()
				const endDate = new Date(
					plotSelectors.endTime(store.getState())
				).toISOString()

				dispatch.applog.log(
					make_info(
						`querying channels: ${channels.map(x => channelToId(x)).join(', ')}`
					)
				)
				async function handleChannel(index: number, channel: DataUiChannel) {
					dispatch.plot.drawPlotRequest({
						index,
						timestamp: Date.now(),
					})
					const channelId = channelToId(channel)
					try {
						dispatch.applog.log(make_debug(`querying data for ${channelId}`))
						const response =
							channel.dataType === 'string'
								? await queryRestApi.queryStringData(
										channel,
										startDate,
										endDate
								  )
								: await queryRestApi.queryData(channel, startDate, endDate)
						dispatch.plot.drawPlotSuccess({
							index,
							timestamp: Date.now(),
							datapoints: response.datapoints,
						})
						dispatch.applog.log(
							make_debug(`received response for ${channelId}`)
						)
					} catch (err) {
						const error = err as Error
						dispatch.plot.drawPlotFailure({
							index,
							timestamp: Date.now(),
							error,
						})
						dispatch.applog.log(
							make_error(`error querying ${channelId}: ${error.message}`)
						)
					}
				}
				for (let i = 0; i < channels.length; i++) {
					const channel = channels[i]
					handleChannel(i, channel)
				}
			},

			async downloadData() {
				// const aggregationSelection = plotSelectors.dialogDownloadAggregation(
				// 	store.getState()
				// )
				// const query = plotSelectors.downloadQuery(store.getState())
				// const response = await queryRestApi.queryDataRaw(query)
				// const blob = await response.blob()
				// const ts = formatDate(Date.now())
				// const fname = `export_${ts}_${aggregationSelection}.csv`
				// FileSaver.saveAs(blob, fname)
			},

			async 'routing/change'(payload: RoutingState<ROUTE>) {
				switch (payload.page) {
					case ROUTE.PLOT:
						// automatically display the query range pop up,
						// but only if we haven't already drawn a plot
						if (!plotSelectors.shouldDisplayChart(store.getState())) {
							dispatch.plot.showQueryRange()
						}
						break

					case ROUTE.PLOT_SINGLE_CHANEL:
						{
							const channel: DataUiChannel = {
								backend: payload.params.backend,
								name: payload.params.name,
							}
							dispatch.plot.setSelectedChannels([channel])
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							dispatch.routing.replace('/plot')
						}
						break

					case ROUTE.PRESELECT:
						handleRoutePreselect(dispatch, payload)
						break

					default:
						break
				}
			},
		}
	},
})

//#region selectors
const getState = (state: AppState) => state.plot

interface HighChartsDataPointWithBinning {
	x?: number
	y?: number
	eventCount?: number
	min?: number
	mean?: number
	max?: number
}

interface HighChartsDataPointWithoutBinning {
	x?: number
	y?: number
	eventCount?: number
}

function getColor(idx: number): string {
	const colors = Highcharts.getOptions().colors
	if (colors) return colors[idx]
	return '#000000'
}

const needsBinning = (item: DataResponseItem): boolean => {
	if (item.data.length === 0) return false
	return item.data.some(x => x.eventCount && x.eventCount > 1)
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

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace plotSelectors {
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

	export const daqPlotYAxes = createSelector(
		[yAxes, plotDataSeries],
		(yAxes, series) =>
			yAxes.map((y, idx) => {
				const ch = series[idx].channel
				const result: DaqPlotYAxis = {
					title: y.title,
					type: y.type,
					side: y.side,
					min: y.min ?? undefined,
					max: y.max ?? undefined,
					unit: y.unit,
				}
				if (ch.dataType === 'string') {
					// TODO: what now?!
					result.categories = Array.from(
						new Set(series[idx].datapoints?.map(pt => pt.y))
					)
				}
				return result
			})
	)

	export const daqPlotConfig = createSelector(
		[plotTitle, plotSubTitle, daqPlotYAxes, plotDataSeries],
		(title, subtitle, yAxes, series) => ({
			title,
			subtitle,
			yAxes,
			series: series.map((x, idx) => {
				return {
					name: x.label,
					yAxis: x.yAxisIndex,
					data:
						(
							x.datapoints as DataUiDataPoint<number, DataUiAggregatedValue>[]
						)?.map(
							p =>
								({
									x: p.x,
									binSize: p.y.count,
									max: p.y.max,
									mean: p.y.mean,
									min: p.y.min,
								} as DaqPlotDataPoint)
						) ?? [],
				} as DaqPlotDataSeries
			}),
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
}
//#endregion
