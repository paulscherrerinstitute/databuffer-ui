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
import {
	channelToId,
	idToChannel,
} from '@paulscherrerinstitute/databuffer-query-js/api/v0/channel'
import { DataResponse, queryRestApi } from '../../api/queryrest'
import { EffectsStore, AppState } from '../store'
import { formatDate } from '../../util'
import { parseISO } from 'date-fns'
import FileSaver from 'file-saver'
import { ROUTE } from '../routing'
import {
	DaqPlotDataPoint,
	DaqPlotDataSeries,
	DaqPlotYAxis,
} from '../../ui/daq-plot/types'
import { DaqPlotConfig } from '../../ui/daq-plot/types'
import { make_debug, make_error, make_info } from './applog'

export interface Channel {
	backend: string
	name: string
}

export interface DataPoints {
	channel: Channel
	values: number[]
}

export enum PlotVariation {
	/** 1 Y axis for all channels */
	SingleAxis = 'single-axis',

	/** 1 Y axis for each channel */
	SeparateAxes = 'separate-axes',

	/** 1 plot (with 1 Y axis) for each channel */
	SeparatePlots = 'separate-plots',
}
export function isPlotVariation(val: any): val is PlotVariation {
	if (typeof val !== 'string') return false
	return Object.values(PlotVariation as Record<string, string>).includes(val)
}

/** DataSeries defines a data set to be plotted in the chart */
export interface DataSeries {
	/** name allows the data series to use a non-technical label */
	name: string
	/** channelIndex is the index into the array of selected channels */
	channelIndex: number
	/** yAxisIndex is the index into the array of defined Y axes */
	yAxisIndex: number
}

/** type of YAxis */
export type YAxisType = 'linear' | 'logarithmic'
export function isYAxisType(val: any): val is YAxisType {
	if (typeof val !== 'string') return false
	return val === 'linear' || val === 'logarithmic'
}

/** YAxis is a value axis of the chart */
export interface YAxis {
	/** title defines the label next to the axis */
	title: string
	/** unit of values on the axis, e.g. 'mbar' */
	unit: string
	/** side defines where on the plot the axis should be put */
	side: 'left' | 'right'
	/** lowest allowed value. set to null for automatic minimum. */
	min: number | null
	/** highest value. set to null for automatic maximum. */
	max: number | null
	/** type of axis */
	type: YAxisType
}

export type DownloadAggregation = 'as-is' | 'PT5S' | 'PT1M' | 'PT1H' | 'raw'

export type DataRequestMeta = {
	fetching: boolean
	error?: Error
	request: {
		sentAt?: number
		finishedAt?: number
	}
	response: DataResponse
}
const _make_empty_datarequest = (): DataRequestMeta => ({
	fetching: false,
	error: undefined,
	request: {
		sentAt: undefined,
		finishedAt: undefined,
	},
	response: [],
})

export interface PlotState {
	plotVariation: PlotVariation
	plotTitle: string
	startTime: number
	endTime: number
	channels: Channel[]
	dataRequests: DataRequestMeta[]
	yAxes: YAxis[]
	dataSeries: DataSeries[]
	queryRangeShowing: boolean
	dialogShareLinkShowing: boolean
	dialogShareLinkAbsoluteTimes: boolean
	dialogDownloadShowing: boolean
	dialogDownloadAggregation: DownloadAggregation
}

// helper functions
const findIndexOfChannel = (state: PlotState, ch: Channel): number =>
	state.channels.findIndex(e => e.backend === ch.backend && e.name === ch.name)

const isChannelSelected = (state: PlotState, ch: Channel): boolean =>
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
		selectChannel(state, channel: Channel) {
			return isChannelSelected(state, channel)
				? state
				: {
						...state,
						channels: [...state.channels, channel],
						yAxes: [
							...state.yAxes,
							{
								title: channel.name,
								unit: '',
								side: state.yAxes.length % 2 === 0 ? 'left' : 'right',
								min: null,
								max: null,
								type: 'linear',
							},
						],
						dataSeries: [
							...state.dataSeries,
							{
								channelIndex: state.channels.length,
								yAxisIndex: state.yAxes.length,
								name: channel.name,
							},
						],
						dataRequests: [...state.dataRequests, _make_empty_datarequest()],
				  }
		},

		unselectChannel(state, index: number) {
			return {
				...state,
				channels: [
					...state.channels.slice(0, index),
					...state.channels.slice(index + 1),
				],
				yAxes: state.yAxes
					.filter((x, idx) => idx !== index)
					.map((x, idx) => ({
						...x,
						side: idx % 2 === 0 ? 'left' : 'right',
					})),
				dataSeries: state.dataSeries
					.filter((x, idx) => idx !== index)
					.map(
						(
							x // shift the indices for all items after the unselected item
						) =>
							x.channelIndex < index
								? x
								: {
										...x,
										channelIndex: x.channelIndex - 1,
										yAxisIndex: x.yAxisIndex - 1,
								  }
					),
				dataRequests: state.dataRequests.filter((x, idx) => idx !== index),
			}
		},

		setSelectedChannels(state, channels: Channel[]) {
			return {
				...state,
				channels: channels,
				yAxes: channels.map((ch, idx) => ({
					title: ch.name,
					side: idx % 2 === 0 ? 'left' : 'right',
					unit: '',
					min: null,
					max: null,
					type: 'linear',
				})),
				dataSeries: channels.map((ch, idx) => ({
					name: ch.name,
					channelIndex: idx,
					yAxisIndex: idx,
				})),
				dataRequests: channels.map(_make_empty_datarequest),
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

		drawPlotRequest(state, payload: { channelIndex: number; sentAt: number }) {
			const { channelIndex, sentAt } = payload
			return {
				...state,
				dataRequests: state.dataRequests.map((r, idx) =>
					idx !== channelIndex
						? r
						: {
								..._make_empty_datarequest(),
								fetching: true,
								request: {
									sentAt,
									finishedAt: undefined,
								},
						  }
				),
			}
		},

		drawPlotSuccess(
			state,
			payload: {
				channelIndex: number
				timestamp: number
				response: DataResponse
			}
		) {
			return {
				...state,
				dataRequests: state.dataRequests.map((r, idx) =>
					idx !== payload.channelIndex
						? r
						: {
								...r,
								fetching: false,
								request: {
									...r.request,
									finishedAt: payload.timestamp,
								},
								response: payload.response,
						  }
				),
			}
		},

		drawPlotFailure(
			state,
			payload: { channelIndex: number; timestamp: number; error: Error }
		) {
			return {
				...state,
				dataRequests: state.dataRequests.map((r, idx) =>
					idx !== payload.channelIndex
						? r
						: {
								...r,
								fetching: false,
								request: {
									...r.request,
									finishedAt: payload.timestamp,
								},
								error: payload.error,
						  }
				),
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
				dispatch.plot.hideQueryRange()
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
				for (let i = 0; i < channels.length; i++) {
					dispatch.plot.drawPlotRequest({
						channelIndex: i,
						sentAt: Date.now(),
					})
					;(async () => {
						const channel = channels[i]
						const channelId = channelToId(channel)
						try {
							dispatch.applog.log(make_debug(`querying data for ${channelId}`))
							const response = await queryRestApi.queryData(
								channel,
								startDate,
								endDate
							)
							dispatch.plot.drawPlotSuccess({
								channelIndex: i,
								timestamp: Date.now(),
								response,
							})
							dispatch.applog.log(
								make_debug(`received response for ${channelId}`)
							)
						} catch (error) {
							dispatch.plot.drawPlotFailure({
								channelIndex: i,
								timestamp: Date.now(),
								error,
							})
							dispatch.applog.log(
								make_error(`error querying ${channelId}: ${error.message}`)
							)
						}
					})()
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
							const channel: Channel = {
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
						{
							// if there are no query params, start over at home view
							if (payload.queries === null) {
								dispatch.routing.replace('/')
								break
							}
							const q = payload.queries as {
								[key: string]: string[] | string
							}
							const MAX_CHANNELS = 16
							const strToDate = (s: string): number =>
								/^\d+$/.test(s) ? Number.parseInt(s, 10) : parseISO(s).getTime()
							let duration = 12 * 60 * 60 * 1000 // 12 hours
							let endTime = Date.now()
							let startTime = endTime - duration
							if (q.duration) {
								duration = Number.parseInt(q.duration as string, 10)
								startTime = endTime - duration
							}
							if (q.endTime) {
								endTime = strToDate(q.endTime as string)
							}
							if (q.startTime) {
								startTime = strToDate(q.startTime as string)
							}

							if (q.plotVariation) {
								const s = q.plotVariation as string
								if (isPlotVariation(s)) {
									dispatch.plot.changePlotVariation(s)
								}
							}

							const channels: Channel[] = []
							// we have to buffer the params into arrays, because we need to
							// add the channels to the selection first; otherwise there are
							// no dataseries and no axes are available
							const dataSeriesLabels: { index: number; label: string }[] = []
							const yAxisTypes: { index: number; type: YAxisType }[] = []
							const yAxisMins: { index: number; min: number }[] = []
							const yAxisMaxs: { index: number; max: number }[] = []
							for (let i = 1; i <= MAX_CHANNELS; i++) {
								let paramName = `c${i}`
								if (!q[paramName]) continue
								channels.push(idToChannel(q[paramName] as string))
								const index = channels.length - 1
								paramName = `l${i}`
								if (q[paramName]) {
									dispatch.plot.changeDataSeriesLabel({
										index,
										label: q[paramName] as string,
									})
								}
								paramName = `y${i}`
								if (q[paramName]) {
									const s = q[paramName] as string
									if (isYAxisType(s)) {
										yAxisTypes.push({ index, type: s })
									}
								}
								paramName = `min${i}`
								if (q[paramName]) {
									const s = q[paramName] as string
									const n = Number.parseFloat(s)
									if (!isNaN(n)) {
										yAxisMins.push({
											index,
											min: n,
										})
									}
								}
								paramName = `max${i}`
								if (q[paramName]) {
									const s = q[paramName] as string
									const n = Number.parseFloat(s)
									if (!isNaN(n)) {
										yAxisMaxs.push({
											index,
											max: n,
										})
									}
								}
							}
							dispatch.plot.setSelectedChannels(channels)
							for (const item of dataSeriesLabels) {
								dispatch.plot.changeDataSeriesLabel(item)
							}
							for (const item of yAxisTypes) {
								dispatch.plot.setAxisType(item)
							}
							for (const item of yAxisMins) {
								dispatch.plot.setAxisMin(item)
							}
							for (const item of yAxisMaxs) {
								dispatch.plot.setAxisMax(item)
							}
							dispatch.plot.changeEndTime(endTime)
							dispatch.plot.changeStartTime(startTime)
							if (q.title) {
								dispatch.plot.changePlotTitle(q.title as string)
							}
							dispatch.plot.drawPlot()
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							dispatch.routing.replace('/plot')
						}
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

export const NR_OF_BINS = 512

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
	export const channels = createSelector([getState], state => state.channels)
	export const dataRequests = createSelector(
		[getState],
		state => state.dataRequests
	)
	export const pendingRequests = createSelector(
		[dataRequests],
		dataRequests => dataRequests.filter(r => r.fetching).length
	)
	export const requestErrors = createSelector([dataRequests], dataRequests =>
		dataRequests.map(r => r.error)
	)
	export const anyRequestErrors = createSelector(
		[requestErrors],
		errors => errors.filter(Boolean).length > 0
	)
	export const allRequestsFinished = createSelector(
		[dataRequests],
		dataRequests => dataRequests.every(r => !r.fetching)
	)
	export const shouldDisplayChart = createSelector(
		[dataRequests],
		dataRequests => dataRequests.some(r => !r.fetching && r.error === undefined)
	)
	/** timestamp of first started request */
	export const firstRequestSentAt = createSelector(
		[dataRequests],
		dataRequests => {
			const times = dataRequests
				.map(r => r.request.sentAt)
				.filter(x => x !== undefined) as number[]
			if (times.length === 0) return undefined
			return Math.max(...times)
		}
	)
	/** timestamp of last finished request */
	export const lastRequestFinishedAt = createSelector(
		[dataRequests],
		dataRequests => {
			const times = dataRequests
				.map(r => r.request.finishedAt)
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

	export const channelsWithoutData = createSelector(
		[dataRequests, channels],
		(dataRequests, channels) =>
			dataRequests
				.filter(r => r.response.length === 0 || r.response[0].data.length === 0)
				.map((_, idx) => channels[idx])
	)

	export const yAxes = createSelector([getState], state => state.yAxes)

	export const dataSeriesConfigs = createSelector(
		[getState],
		state => state.dataSeries
	)

	export const dataPoints = createSelector(
		[channels, dataRequests],
		(channels, dataRequests) =>
			channels.map((x, idx) => {
				const response = dataRequests[idx].response
				const responseItem = response[0] // only 1 channel per request
				const binning = needsBinning(responseItem)
				const data = binning
					? responseItem.data.map(mapDataPointWithBinning)
					: responseItem.data.map(mapDataPointWithoutBinning)
				return {
					needsBinning: binning,
					data,
				}
			})
	)

	export const daqPlotYAxes = createSelector([yAxes], yAxes =>
		yAxes.map(
			y =>
				({
					title: y.title,
					type: y.type,
					side: y.side,
					min: y.min,
					max: y.max,
					unit: y.unit,
				} as DaqPlotYAxis)
		)
	)

	export const daqPlotDataSeries = createSelector(
		[channels, dataRequests, dataSeriesConfigs],
		(channels, dataRequests, dataSeriesConfigs) =>
			channels.map((_, i) => ({
				name: dataSeriesConfigs[i].name,
				yAxis: dataSeriesConfigs[i].yAxisIndex,
				data:
					dataRequests[i].response.length === 0
						? []
						: dataRequests[i].response[0].data.map(item => ({
								x: item.globalMillis as number,
								min: (item.value as AggregationResult).min as number,
								max: (item.value as AggregationResult).max as number,
								mean: (item.value as AggregationResult).mean as number,
								binSize: item.eventCount as number,
						  })),
			}))
	)

	export const daqPlotConfig = createSelector(
		[plotTitle, plotSubTitle, daqPlotYAxes, daqPlotDataSeries],
		(title, subtitle, yAxes, series) => ({
			title,
			subtitle,
			yAxes,
			series,
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
			dataSeriesConfigs,
			yAxes,
			dialogShareLinkAbsoluteTimes,
			channels,
			startTime,
			endTime,
			plotTitle,
			plotVariation,
		],
		(
			dataSeriesConfig,
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
			dataSeriesConfig.slice(0, 16).forEach((cfg, i) => {
				if (cfg.name !== channels[cfg.channelIndex].name) {
					params.push(`l${i + 1}=${encodeURIComponent(cfg.name)}`)
				}
				if (yAxes[cfg.yAxisIndex].type !== 'linear') {
					params.push(
						`y${i + 1}=${encodeURIComponent(yAxes[cfg.yAxisIndex].type)}`
					)
				}
				if (yAxes[cfg.yAxisIndex].min !== null) {
					params.push(
						`min${i + 1}=${encodeURIComponent(
							yAxes[cfg.yAxisIndex].min!.toString(10)
						)}`
					)
				}
				if (yAxes[cfg.yAxisIndex].max !== null) {
					params.push(
						`max${i + 1}=${encodeURIComponent(
							yAxes[cfg.yAxisIndex].max!.toString(10)
						)}`
					)
				}
			})

			if (absTimes) {
				params.push(`startTime=${startTime}`)
				params.push(`endTime=${endTime}`)
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
