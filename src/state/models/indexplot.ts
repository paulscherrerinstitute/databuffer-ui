import { createModel } from '@captaincodeman/rdx'
import { createSelector } from 'reselect'
import { channelToId, DataUiChannel } from '../../shared/channel'
import { MinMax } from '../../shared/dataseries'
import { AppState, EffectsStore } from '../store'
import { appcfgSelectors } from './appcfg'
import { make_error } from './applog'

export type IndexplotState = {
	channel?: DataUiChannel
	binStart?: number
	binEnd?: number
	timestamps?: number[]
	envelope?: MinMax[]
	currEvtIdx?: number
	eventData?: number[]
	fetching: boolean
	error?: Error
}

export const indexplot = createModel({
	state: {
		fetching: false,
	} as IndexplotState,
	reducers: {
		selectChannelAndBin(
			state: IndexplotState,
			payload: { channel: DataUiChannel; binStart: number; binEnd: number }
		) {
			return {
				...payload,
				timestamps: undefined,
				envelope: undefined,
				currEvtIdx: undefined,
				eventData: undefined,
				fetching: false,
				error: undefined,
			}
		},

		gotoEvent(state: IndexplotState, eventIdx: number) {
			return { ...state, currEvtIdx: eventIdx }
		},

		timestampsRequest(state: IndexplotState) {
			return {
				...state,
				fetching: true,
				timestamps: undefined,
			}
		},
		timestampsSuccess(state: IndexplotState, timestamps: number[]) {
			return { ...state, fetching: false, timestamps }
		},
		timestampsFailure(state: IndexplotState, error: Error) {
			return { ...state, fetching: false, error }
		},

		envelopeRequest(state: IndexplotState) {
			return { ...state, fetching: true, envelope: undefined }
		},
		envelopeSuccess(state: IndexplotState, envelope: MinMax[]) {
			return { ...state, fetching: false, envelope }
		},
		envelopeFailure(state: IndexplotState, error: Error) {
			return { ...state, fetching: false, error }
		},

		eventDataRequest(state: IndexplotState) {
			return { ...state, fetching: true, eventData: undefined }
		},
		eventDataSuccess(state: IndexplotState, eventData: number[]) {
			return { ...state, fetching: false, eventData }
		},
		eventDataFailure(state: IndexplotState, error: Error) {
			return { ...state, fetching: false, error }
		},
	},
	effects(store: EffectsStore) {
		const dispatch = store.getDispatch()
		return {
			async selectChannelAndBin() {
				// overview outline:
				// 1.  get API provider
				// 2.  request timestamps
				// 3.  request envelope curve
				// 4.  go to first event

				const channel = indexplotSelectors.channel(store.getState())
				if (channel === undefined) {
					throw new Error('channel is undefined')
				}
				const channelId = indexplotSelectors.channelId(store.getState())
				const dateStart = indexplotSelectors.dateStart(store.getState())
				if (dateStart === '') {
					throw new Error('bin start is undefined')
				}
				const dateEnd = indexplotSelectors.dateEnd(store.getState())
				if (dateEnd === '') {
					throw new Error('bin end is undefined')
				}

				const queryApis = appcfgSelectors.backendToQueryApi(store.getState())
				const api = queryApis.get(channel.backend)
				if (!api) {
					dispatch.applog.log(make_error(`no api provider for ${channelId}`))
					return
				}

				try {
					dispatch.indexplot.timestampsRequest()
					const timestamps = await api.queryEventTimestampsInBin(
						channel,
						dateStart,
						dateEnd
					)
					dispatch.indexplot.timestampsSuccess(timestamps)
				} catch (e) {
					dispatch.indexplot.timestampsFailure(e as Error)
					return
				}

				try {
					dispatch.indexplot.envelopeRequest()
					const envelope = await api.queryIndexedMinMaxInBin(
						channel,
						dateStart,
						dateEnd
					)
					dispatch.indexplot.envelopeSuccess(envelope)
				} catch (e) {
					dispatch.indexplot.envelopeFailure(e as Error)
					return
				}

				dispatch.indexplot.gotoEvent(0)
			},

			async gotoEvent() {
				const channel = indexplotSelectors.channel(store.getState())
				if (channel === undefined) {
					throw new Error('channel is undefined')
				}
				const channelId = indexplotSelectors.channelId(store.getState())
				const queryApis = appcfgSelectors.backendToQueryApi(store.getState())
				const api = queryApis.get(channel.backend)
				if (!api) {
					dispatch.applog.log(make_error(`no api provider for ${channelId}`))
					return
				}
				const currEvtIdx = indexplotSelectors.currentEventIndex(
					store.getState()
				)
				if (currEvtIdx === undefined) {
					throw new Error('current event index is undefined')
				}
				const timestamps = indexplotSelectors.timestamps(store.getState())
				if (timestamps === undefined) {
					throw new Error('timestamps in bin are undefined')
				}
				const ts = timestamps[currEvtIdx]
				try {
					dispatch.indexplot.eventDataRequest()
					const values = await api.queryWaveFormAtTimestamp(channel, ts)
					dispatch.indexplot.eventDataSuccess(values)
				} catch (e) {
					dispatch.indexplot.eventDataFailure(e as Error)
					return
				}
			},

			async gotoFirstEvent() {
				if (!indexplotSelectors.hasPreviousEvent(store.getState())) return
				dispatch.indexplot.gotoEvent(0)
			},

			async gotoPrevEvent() {
				if (!indexplotSelectors.hasPreviousEvent(store.getState())) return
				const i = indexplotSelectors.currentEventIndex(store.getState()) ?? 1
				dispatch.indexplot.gotoEvent(i - 1)
			},

			async gotoNextEvent() {
				if (!indexplotSelectors.hasNextEvent(store.getState())) return
				const i = indexplotSelectors.currentEventIndex(store.getState()) ?? 0
				dispatch.indexplot.gotoEvent(i + 1)
			},

			async gotoLastEvent() {
				if (!indexplotSelectors.hasNextEvent(store.getState())) return
				const n = indexplotSelectors.numEvents(store.getState())
				dispatch.indexplot.gotoEvent(n - 1)
			},
		}
	},
})

const getState = (state: AppState) => state.indexplot

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace indexplotSelectors {
	export const channel = createSelector([getState], state => state.channel)

	export const binStart = createSelector([getState], state => state.binStart)

	export const binEnd = createSelector([getState], state => state.binEnd)

	export const timestamps = createSelector(
		[getState],
		state => state.timestamps
	)

	export const envelope = createSelector([getState], state => state.envelope)

	export const currentEventIndex = createSelector(
		[getState],
		state => state.currEvtIdx
	)

	export const eventData = createSelector([getState], state => state.eventData)

	export const fetching = createSelector([getState], state => state.fetching)

	export const error = createSelector([getState], state => state.error)

	export const channelId = createSelector([channel], channel =>
		channel ? channelToId(channel) : ''
	)

	export const dateStart = createSelector([binStart], ts =>
		ts ? new Date(ts).toISOString() : ''
	)

	export const dateEnd = createSelector([binEnd], ts =>
		ts ? new Date(ts).toISOString() : ''
	)

	export const numEvents = createSelector(
		[timestamps],
		timestamps => timestamps?.length ?? 0
	)

	export const hasPreviousEvent = createSelector(
		[numEvents, currentEventIndex],
		(n, idx) => {
			if (n === 0) return false
			if (idx === undefined) return false
			if (idx <= 0) return false
			return true
		}
	)

	export const hasNextEvent = createSelector(
		[numEvents, currentEventIndex],
		(n, idx) => {
			if (n === 0) return false
			if (idx === undefined) return false
			if (idx >= n - 1) return false
			return true
		}
	)
}
