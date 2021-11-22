import { createModel, RoutingState } from '@captaincodeman/rdx'

import { EffectsStore } from '../../store'
import { ROUTE } from '../../routing'
import { make_debug, make_error, make_info } from '../applog'
import { channelToId, DataUiChannel } from '../../../shared/channel'
import { DataUiDataPoint } from '../../../shared/dataseries'

import {
	DownloadAggregation,
	PlotState,
	PlotVariation,
	YAxisType,
} from './types'
import { handleRoutePreselect } from './preselect'
import * as plotSelectors from './selectors'
import { appcfgSelectors } from '../appcfg'
import { waitUntil } from '../../../util'

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
						const response =
							channel.dataType === 'string'
								? await api.queryStringData(
										channel,
										startDate,
										endDate,
										queryExpansion
								  )
								: await api.queryBinnedData(
										channel,
										startDate,
										endDate,
										queryExpansion
								  )
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
