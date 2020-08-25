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
} from '@psi/databuffer-query-js/query-data'
import { channelToId, idToChannel } from '@psi/databuffer-query-js/channel'
import { DataResponse, queryRestApi } from '../../api/queryrest'
import { Store, State } from '../store'
import { formatDate } from '../../util'
import { parseISO } from 'date-fns'
import FileSaver from 'file-saver'
import { ROUTE } from '../routing'

export interface Channel {
	backend: string
	name: string
}

export enum QueryMode {
	TIME = 'time',
	PULSE = 'pulse',
}

export interface DataPoints {
	channel: Channel
	values: number[]
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

export interface PlotState {
	plotTitle: string
	startTime: number
	endTime: number
	startPulse: number
	endPulse: number
	queryMode: 'time' | 'pulse'
	channels: { backend: string; name: string }[]
	fetching: boolean
	error: Error
	request: {
		sentAt: number
		finishedAt: number
	}
	response: DataResponse
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
		plotTitle: '',
		startTime: Date.now() - 60_000,
		endTime: Date.now(),
		startPulse: 1,
		endPulse: 2,
		queryMode: 'time',
		channels: [],
		fetching: false,
		error: null,
		request: {
			sentAt: undefined,
			finishedAt: undefined,
		},
		response: [],
		yAxes: [],
		dataSeries: [],
		queryRangeShowing: false,
		dialogShareLinkShowing: false,
		dialogShareLinkAbsoluteTimes: true,
		dialogDownloadShowing: false,
		dialogDownloadAggregation: 'as-is',
	} as PlotState,
	reducers: {
		selectChannel: (state, channel: Channel) =>
			isChannelSelected(state, channel)
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
				  },

		unselectChannel: (state, index: number) => ({
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
				.map((
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
		}),

		setSelectedChannels: (state, channels: Channel[]) => ({
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
		}),

		changePlotTitle: (state, plotTitle: string) => ({
			...state,
			plotTitle,
		}),

		changeDataSeriesLabel: (
			state,
			payload: { index: number; label: string }
		) => ({
			...state,
			dataSeries: state.dataSeries.map((series, idx) =>
				idx !== payload.index ? series : { ...series, name: payload.label }
			),
			yAxes: state.yAxes.map((axis, idx) =>
				idx !== payload.index ? axis : { ...axis, title: payload.label }
			),
		}),

		changeStartTime: (state, startTime: number) => ({
			...state,
			startTime,
		}),

		changeEndTime: (state, endTime: number) => ({
			...state,
			endTime,
		}),

		drawPlotRequest: (state, sentAt: number) => ({
			...state,
			fetching: true,
			error: null,
			request: {
				sentAt,
				finishedAt: undefined,
			},
			response: [],
		}),

		drawPlotSuccess: (
			state,
			payload: { timestamp: number; response: DataResponse }
		) => ({
			...state,
			fetching: false,
			request: {
				...state.request,
				finishedAt: payload.timestamp,
			},
			response: payload.response,
		}),

		drawPlotFailure: (state, payload: { timestamp: number; error: Error }) => ({
			...state,
			fetching: false,
			request: {
				...state.request,
				finishedAt: payload.timestamp,
			},
			error: payload.error,
		}),

		toggleQueryRange: state => ({
			...state,
			queryRangeShowing: !state.queryRangeShowing,
		}),

		hideQueryRange: state => ({
			...state,
			queryRangeShowing: false,
		}),

		showQueryRange: state => ({
			...state,
			queryRangeShowing: true,
		}),

		showShareLink: state => ({
			...state,
			dialogShareLinkShowing: true,
		}),

		hideShareLink: state => ({
			...state,
			dialogShareLinkShowing: false,
		}),

		shareAbsoluteTimes: state => ({
			...state,
			dialogShareLinkAbsoluteTimes: true,
		}),

		shareRelativeTimes: state => ({
			...state,
			dialogShareLinkAbsoluteTimes: false,
		}),

		setAxisMin: (state, payload: { index: number; min: number }) => ({
			...state,
			yAxes: state.yAxes.map((axis, index) =>
				index !== payload.index ? axis : { ...axis, min: payload.min }
			),
		}),

		setAxisMax: (state, payload: { index: number; max: number }) => ({
			...state,
			yAxes: state.yAxes.map((axis, index) =>
				index !== payload.index ? axis : { ...axis, max: payload.max }
			),
		}),

		setAxisType: (state, payload: { index: number; type: YAxisType }) => ({
			...state,
			yAxes: state.yAxes.map((axis, index) =>
				index !== payload.index ? axis : { ...axis, type: payload.type }
			),
		}),

		showDownload: state => ({
			...state,
			dialogDownloadShowing: true,
		}),

		hideDownload: state => ({
			...state,
			dialogDownloadShowing: false,
		}),

		setDownloadAggregation: (state, aggregation: DownloadAggregation) => ({
			...state,
			dialogDownloadAggregation: aggregation,
		}),
	},

	effects(store: Store) {
		const dispatch = store.getDispatch()
		return {
			async drawPlot() {
				const query = plotSelectors.plotQuery(store.getState())
				dispatch.plot.hideQueryRange()
				dispatch.plot.drawPlotRequest(Date.now())
				try {
					const response = await queryRestApi.queryData(query)
					dispatch.plot.drawPlotSuccess({ timestamp: Date.now(), response })
				} catch (error) {
					dispatch.plot.drawPlotFailure({ timestamp: Date.now(), error })
				}
			},

			async downloadData() {
				const aggregationSelection = plotSelectors.dialogDownloadAggregation(
					store.getState()
				)
				const query = plotSelectors.plotQuery(store.getState())
				const response = await queryRestApi.queryDataRaw(query)
				const blob = await response.blob()
				const ts = formatDate(Date.now())
				const fname = `export_${ts}_${aggregationSelection}.csv`
				FileSaver.saveAs(blob, fname)
			},

			async 'routing/change'(payload: RoutingState) {
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
							const MAX_CHANNELS = 16
							const strToDate = (s: string): number =>
								/^\d+$/.test(s) ? Number.parseInt(s, 10) : parseISO(s).getTime()

							let duration = 12 * 60 * 60 * 1000 // 12 hours
							let endTime = Date.now()
							let startTime = endTime - duration
							if (payload.queries && payload.queries.duration) {
								duration = Number.parseInt(
									payload.queries.duration as string,
									10
								)
								startTime = endTime - duration
							}
							if (payload.queries && payload.queries.endTime) {
								endTime = strToDate(payload.queries.endTime as string)
							}
							if (payload.queries && payload.queries.startTime) {
								startTime = strToDate(payload.queries.startTime as string)
							}

							const channels: Channel[] = []
							const dataSeriesLabels: { index: number; label: string }[] = []
							for (let i = 1; i <= MAX_CHANNELS; i++) {
								let paramName = `c${i}`
								if (!payload.queries[paramName]) continue
								channels.push(idToChannel(payload.queries[paramName] as string))
								paramName = `l${i}`
								if (!payload.queries[paramName]) continue
								dataSeriesLabels.push({
									index: channels.length - 1,
									label: payload.queries[paramName] as string,
								})
							}
							dispatch.plot.setSelectedChannels(channels)
							for (const item of dataSeriesLabels) {
								dispatch.plot.changeDataSeriesLabel(item)
							}
							dispatch.plot.changeEndTime(endTime)
							dispatch.plot.changeStartTime(startTime)
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
const getState = (state: State) => state.plot

export const NR_OF_BINS = 512

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
	return item.data.some(x => x.eventCount > 1)
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
		[
			highchartsYAxes,
			highchartsDataSeries,
			highchartsTitle,
			highchartsSubTitle,
		],
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
		[
			dataSeriesConfig,
			dialogShareLinkAbsoluteTimes,
			channels,
			startTime,
			endTime,
		],
		(dataSeriesConfig, absTimes, channels, startTime, endTime) => {
			const params = channels
				.slice(0, 16)
				.map((ch, i) => `c${i + 1}=${encodeURIComponent(channelToId(ch))}`)
			dataSeriesConfig.slice(0, 16).forEach((cfg, i) => {
				if (cfg.name === channels[cfg.channelIndex].name) return
				params.push(`l${i + 1}=${encodeURIComponent(cfg.name)}`)
			})

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
					EventField.PULSE_ID,
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
					EventField.PULSE_ID,
					EventField.VALUE,
					EventField.EVENT_COUNT,
				],
				response: {
					format: DataResponseFormatType.CSV,
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
		[downloadQuery],
		q =>
			`curl -L -H 'Content-Type: application/json' -X POST -d '${JSON.stringify(
				q
			)}' ${window.DatabufferUi.QUERY_API}/query`
	)
}
//#endregion
