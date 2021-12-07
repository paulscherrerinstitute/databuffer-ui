import { createModel, RoutingState } from '@captaincodeman/rdx'
import {
	Datapoint,
	transformToLinePlotData,
} from '@paulscherrerinstitute/databuffer-query-js/transforms'

import { EffectsStore } from '../../store'
import { ROUTE } from '../../routing'
import { make_debug, make_error, make_info } from '../applog'
import { channelToId, DataUiChannel } from '../../../shared/channel'
import {
	DataUiAggregatedValue,
	DataUiDataPoint,
	DataUiDataSeries,
} from '../../../shared/dataseries'

import {
	CsvFieldQuotes,
	CsvFieldSeparator,
	CsvLineTerminator,
	DownloadAggregation,
	PlotDataSeries,
	PlotState,
	PlotVariation,
	YAxisType,
} from './types'
import { handleRoutePreselect } from './preselect'
import * as plotSelectors from './selectors'
import { appcfgSelectors } from '../appcfg'
import { waitUntil } from '../../../util'
import { createCsvFile, DataUiCsvDataSeries } from './csv'
import { saveAs } from 'file-saver'
import { NR_OF_BINS } from '../../../api/queryapi'

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
		queryExpansion: false,
		channels: [],
		dataRequests: [],
		yAxes: [],
		dataSeries: [],
		queryRangeShowing: false,
		dialogShareLinkShowing: false,
		dialogShareLinkAbsoluteTimes: true,
		dialogDownloadShowing: false,
		dialogDownloadAggregation: 'PT1M',
		csvFieldSeparator: 'tab',
		csvFieldQuotes: 'none',
		csvLineTerminator: 'crlf',
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
			// re-distribute all following axes
			for (let i = index; i < yAxes.length; i++) {
				yAxes[i].side = i % 2 === 0 ? 'left' : 'right'
			}
			// shift yAxisIndex after deleting the yAxis
			for (let i = index; i < dataSeries.length; i++) {
				dataSeries[i].yAxisIndex -= 1
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
				isReduced: undefined,
				numDatapoints: undefined,
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
				datapoints: DataUiDataPoint<
					number,
					string | number | DataUiAggregatedValue
				>[]
				isReduced: boolean
				numDatapoints: number
			}
		) {
			const { index, timestamp, datapoints, isReduced, numDatapoints } = payload
			const dataSeries = [...state.dataSeries]
			dataSeries[index] = {
				...dataSeries[index],
				fetching: false,
				requestFinishedAt: timestamp,
				datapoints,
				isReduced,
				numDatapoints,
			}
			const result = {
				...state,
				dataSeries,
			}
			if (dataSeries[index].channel.dataType === 'string') {
				const yAxes = [...state.yAxes]
				const yAxisIndex = dataSeries[index].yAxisIndex
				yAxes[yAxisIndex].categories = Array.from(
					new Set(
						(
							dataSeries[index].datapoints as Array<
								DataUiDataPoint<number, string>
							>
						)?.map(pt => pt.y)
					)
				)
				result.yAxes = yAxes
			}
			return result
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

		setQueryExpansion(state, queryExpansion: boolean) {
			return { ...state, queryExpansion }
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

		setCsvFieldSeparator(state, csvFieldSeparator: CsvFieldSeparator) {
			return { ...state, csvFieldSeparator }
		},
		setCsvFieldQuotes(state, csvFieldQuotes: CsvFieldQuotes) {
			return { ...state, csvFieldQuotes }
		},
		setCsvLineTerminator(state, csvLineTerminator: CsvLineTerminator) {
			return { ...state, csvLineTerminator }
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
				const queryApis = appcfgSelectors.backendToQueryApi(store.getState())
				async function handleChannel(index: number, channel: DataUiChannel) {
					dispatch.plot.drawPlotRequest({
						index,
						timestamp: Date.now(),
					})
					const channelId = channelToId(channel)
					try {
						const api = queryApis.get(channel.backend)
						if (!api) {
							dispatch.applog.log(
								make_error(`no api provider for ${channelId}`)
							)
							return
						}
						dispatch.applog.log(make_debug(`querying data for ${channelId}`))
						const queryExpansion = plotSelectors.queryExpansion(
							store.getState()
						)
						let response: DataUiDataSeries<
							number,
							number | string | DataUiAggregatedValue
						>
						let isReduced = false
						let numDatapoints = 0
						if (channel.dataType === 'string') {
							response = await api.queryStringData(
								channel,
								startDate,
								endDate,
								queryExpansion
							)
							numDatapoints = response.datapoints.length
						} else {
							isReduced = true
							response = await api.queryBinnedData(
								channel,
								startDate,
								endDate,
								queryExpansion
							)
							numDatapoints = (
								response as DataUiDataSeries<number, DataUiAggregatedValue>
							).datapoints
								.map(item => item.y.count)
								.reduce((prev, current) => current + prev, 0)
							if (numDatapoints > 0 && numDatapoints < NR_OF_BINS) {
								isReduced = false
								response = await api.queryRawData(
									channel,
									startDate,
									endDate,
									queryExpansion
								)
								numDatapoints = response.datapoints.length
							}
						}
						dispatch.plot.drawPlotSuccess({
							index,
							timestamp: Date.now(),
							datapoints: response.datapoints,
							isReduced,
							numDatapoints,
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
				const state = store.getState()
				const dataseries = plotSelectors.plotDataSeries(state)
				const startTime = plotSelectors.startTime(state)
				const startDate = new Date(startTime).toISOString()
				const endTime = plotSelectors.endTime(state)
				const endDate = new Date(endTime).toISOString()
				const queryExpansion = plotSelectors.queryExpansion(state)
				const stepSize = plotSelectors.csvStepSize(state)
				const fieldQuotes = plotSelectors.csvFieldQuotes(state)
				const fieldSeparator = plotSelectors.csvFieldSeparator(state)
				const lineTerminator = plotSelectors.csvLineTerminator(state)

				dispatch.applog.log(
					make_info(
						`downloading csv for channels: ${dataseries
							.map(x => channelToId(x.channel))
							.join(', ')}`
					)
				)
				const queryApis = appcfgSelectors.backendToQueryApi(store.getState())
				async function handleDataSeries(
					series: PlotDataSeries
				): Promise<DataUiCsvDataSeries> {
					const channel = series.channel
					const channelId = channelToId(channel)
					try {
						const api = queryApis.get(channel.backend)
						if (!api) {
							throw new Error(`no api provider for ${channelId}`)
						}
						dispatch.applog.log(make_debug(`querying data for ${channelId}`))
						let response: DataUiDataSeries<number, number | string>
						if (channel.dataType === 'string') {
							response = await api.queryStringData(
								channel,
								startDate,
								endDate,
								queryExpansion
							)
						} else {
							response = await api.queryRawData(
								channel,
								startDate,
								endDate,
								queryExpansion
							)
						}
						dispatch.applog.log(
							make_debug(`received response for ${channelId}`)
						)

						const data: Datapoint<number | string | undefined>[] =
							transformToLinePlotData(response.datapoints, {
								startAt: startTime,
								endAt: endTime,
								stepSize,
							})
						const result: DataUiCsvDataSeries = {
							name: series.label,
							datapoints: data,
						}
						return result
					} catch (err) {
						const error = err as Error
						dispatch.applog.log(
							make_error(`error querying ${channelId}: ${error.message}`)
						)
						throw err
					}
				}
				const promises = dataseries.map(x => handleDataSeries(x))
				const csvDataSeries = await Promise.all(promises)
				const csvText = createCsvFile(csvDataSeries, {
					fieldQuotes,
					fieldSeparator,
					lineTerminator,
				})
				const blob = new Blob([csvText], {
					type: 'text/csv;charset=utf-8',
				})
				const ts = new Date().toISOString()
				const fname = `export_${ts}_.csv`
				saveAs(blob, fname)
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
						// wait until the query api providers have been configured
						await waitUntil(
							() => !appcfgSelectors.queryApiProvidersFetching(store.getState())
						)
						handleRoutePreselect(
							dispatch,
							payload,
							appcfgSelectors.backendToQueryApi(store.getState())
						)
						break

					default:
						break
				}
			},
		}
	},
})
