import { createModel } from '@captaincodeman/rdx'
import { createSelector } from 'reselect'
import { correlateData } from '../../api/correlation'
import { channelToId, DataUiChannel } from '../../shared/channel'
import type { DataUiDataPoint } from '../../shared/dataseries'
import type { AppState, EffectsStore } from '../store'
import { appcfgSelectors } from './appcfg'
import { make_error } from './applog'

export type ChannelInfo = {
	channel?: DataUiChannel
	request: RequestStatus
}

export type RequestStatus = {
	fetching: boolean
	sentAt?: number
	finishedAt?: number
	error?: Error
}

export type CorrelationplotState = {
	startTime: number
	endTime: number
	queryExpansion: boolean
	channels: ChannelInfo[]
	correlatedData?: DataUiDataPoint<number, number>[]
}

export const correlationplot = createModel({
	state: {
		startTime: Date.now() - 3_600_000,
		endTime: Date.now(),
		queryExpansion: false,
		channels: [
			{ request: { fetching: false } },
			{ request: { fetching: false } },
		],
	} as CorrelationplotState,
	reducers: {
		setRange(
			state: CorrelationplotState,
			payload: { start: number; end: number }
		) {
			return { ...state, startTime: payload.start, endTime: payload.end }
		},
		setQueryExpansion(state: CorrelationplotState, queryExpansion) {
			return { ...state, queryExpansion }
		},
		selectChannels(
			state: CorrelationplotState,
			payload: { channelX: DataUiChannel; channelY: DataUiChannel }
		) {
			const channelX: ChannelInfo = {
				channel: payload.channelX,
				request: { fetching: false },
			}
			const channelY: ChannelInfo = {
				channel: payload.channelY,
				request: { fetching: false },
			}
			const channels = [channelX, channelY]
			return { ...state, channels }
		},
		swapChannels(state: CorrelationplotState) {
			const channels = [{ ...state.channels[1] }, { ...state.channels[0] }]
			const correlatedData = state.correlatedData
				? state.correlatedData.map(pt => ({ x: pt.y, y: pt.x }))
				: undefined
			return { ...state, channels, correlatedData }
		},
		clearCorrelatedData(state: CorrelationplotState) {
			return { ...state, correlatedData: undefined }
		},
		setCorrelatedData(
			state: CorrelationplotState,
			correlatedData: DataUiDataPoint<number, number>[]
		) {
			return { ...state, correlatedData }
		},
		channelDataRequest(
			state: CorrelationplotState,
			payload: { index: number; timestamp: number }
		) {
			const { index, timestamp } = payload
			const channels = [...state.channels]
			channels[index] = {
				...channels[index],
				request: { fetching: true, sentAt: timestamp },
			}
			return { ...state, channels }
		},
		channelDataSuccess(
			state: CorrelationplotState,
			payload: { index: number; timestamp: number }
		) {
			const { index, timestamp } = payload
			const channels = [...state.channels]
			channels[index] = {
				...channels[index],
				request: { fetching: false, finishedAt: timestamp },
			}
			return { ...state, channels }
		},
		channelDataFailure(
			state: CorrelationplotState,
			payload: { index: number; timestamp: number; error: Error }
		) {
			const { index, timestamp, error } = payload
			const channels = [...state.channels]
			channels[index] = {
				...channels[index],
				request: { fetching: false, finishedAt: timestamp, error },
			}
			return { ...state, channels }
		},
	},
	effects(store: EffectsStore) {
		const dispatch = store.getDispatch()
		return {
			async setRange() {
				dispatch.correlationplot.clearCorrelatedData()
			},
			async setQueryExpansion() {
				dispatch.correlationplot.clearCorrelatedData()
			},
			async selectChannels() {
				dispatch.correlationplot.clearCorrelatedData()
			},
			async drawPlot() {
				dispatch.correlationplot.clearCorrelatedData()
				const startTime = correlationplotSelectors.startTime(store.getState())
				const startDate = new Date(startTime).toISOString()
				const endTime = correlationplotSelectors.endTime(store.getState())
				const endDate = new Date(endTime).toISOString()
				const queryExpansion = correlationplotSelectors.queryExpansion(
					store.getState()
				)

				// inner function to hand the asyncronous stuff for a single channel
				const handleChannel = async (index: number) => {
					const channel = correlationplotSelectors.channels(store.getState())[
						index
					].channel
					if (channel === undefined) {
						throw new Error(`No channel with index ${index}`)
					}
					const channelId = channelToId(channel)
					const queryApis = appcfgSelectors.backendToQueryApi(store.getState())
					const api = queryApis.get(channel.backend)
					if (!api) {
						dispatch.applog.log(make_error(`no api provider for ${channelId}`))
						throw new Error(`no api provider for ${channelId}`)
					}
					dispatch.correlationplot.channelDataRequest({
						index,
						timestamp: Date.now(),
					})
					try {
						// TODO: go! fetch! good boy! good! who's a good boy?!
						const apiData = await api.queryRawScalarData<number>(
							channel,
							startDate,
							endDate,
							queryExpansion
						)
						dispatch.correlationplot.channelDataSuccess({
							index,
							timestamp: Date.now(),
						})
						return apiData.datapoints
					} catch (e) {
						const error = e as Error
						dispatch.correlationplot.channelDataFailure({
							index,
							timestamp: Date.now(),
							error,
						})
						throw e // notify the outside world of the problem
					}
				}
				try {
					const [xData, yData] = await Promise.all([
						handleChannel(0),
						handleChannel(1),
					])
					const correlatedData = correlateData(xData, yData)
					dispatch.correlationplot.setCorrelatedData(correlatedData)
				} catch (e) {
					// already handled b
				}
			},
		}
	},
})

const getState = (state: AppState) => state.correlationplot

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace correlationplotSelectors {
	export const startTime = createSelector([getState], state => state.startTime)
	export const endTime = createSelector([getState], state => state.endTime)
	export const queryExpansion = createSelector(
		[getState],
		state => state.queryExpansion
	)
	export const correlatedData = createSelector(
		[getState],
		state => state.correlatedData
	)
	export const channels = createSelector([getState], state => state.channels)
	export const channelX = createSelector(
		[channels],
		channels => channels[0].channel
	)
	export const channelY = createSelector(
		[channels],
		channels => channels[1].channel
	)
	export const fetching = createSelector(
		[channels],
		channels => channels[0].request.fetching && channels[1].request.fetching
	)
	export const error = createSelector([channels], channels => {
		for (const ch of channels) {
			if (ch.request.error) {
				return ch.request.error
			}
		}
		return undefined
	})
}
