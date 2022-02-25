import { createModel } from '@captaincodeman/rdx'
import { createSelector } from 'reselect'
import type { DataUiQueryApi } from '../../api'
import { channelToId, DataUiChannel } from '../../shared/channel'
import type { DataUiDataPoint, DataUiImage } from '../../shared/dataseries'
import type { AppDispatch, AppState, EffectsStore } from '../store'
import { appcfgSelectors } from './appcfg'
import { make_error } from './applog'

export type RequestStatus = {
	fetching: boolean
	sentAt?: number
	finishedAt?: number
	error?: Error
}

export type ImageviewerState = {
	startTime: number
	endTime: number
	channel?: DataUiChannel
	request: RequestStatus
	thumbnails: DataUiDataPoint<number, DataUiImage>[]
	currentSlice?: number
	sliceLoadingCanceled: boolean
}

const SLICE_LENGTH = 10_000 // 10 seconds

export const imageviewer = createModel({
	state: {
		startTime: Date.now() - 10_000,
		endTime: Date.now(),
		queryExpansion: false,
		request: { fetching: false },
		thumbnails: [],
		currentSlice: 0,
		sliceLoadingCanceled: false,
	} as ImageviewerState,
	reducers: {
		setRange(state: ImageviewerState, payload: { start: number; end: number }) {
			return { ...state, startTime: payload.start, endTime: payload.end }
		},
		selectChannel(state: ImageviewerState, channel: DataUiChannel) {
			return { ...state, channel }
		},
		channelDataRequest(state: ImageviewerState, timestamp: number) {
			return {
				...state,
				request: { fetching: true, sentAt: timestamp },
			}
		},
		channelDataSuccess(state: ImageviewerState, timestamp: number) {
			return { ...state, request: { fetching: false, finishedAt: timestamp } }
		},
		channelDataFailure(
			state: ImageviewerState,
			payload: { timestamp: number; error: Error }
		) {
			const { timestamp, error } = payload
			return {
				...state,
				request: { fetching: false, finishedAt: timestamp, error },
			}
		},
		clearThumbnails(state: ImageviewerState) {
			return { ...state, thumbnails: [] }
		},
		addThumbnailSlice(
			state: ImageviewerState,
			slice: DataUiDataPoint<number, DataUiImage>[]
		) {
			const thumbnails = [...state.thumbnails, ...slice]
			return { ...state, thumbnails }
		},
		setCurrentSlice(state: ImageviewerState, currentSlice: number) {
			return { ...state, currentSlice }
		},
		setSliceLoadingCanceled(
			state: ImageviewerState,
			sliceLoadingCanceled: boolean
		) {
			return { ...state, sliceLoadingCanceled }
		},
	},
	effects(store: EffectsStore) {
		const dispatch = store.getDispatch()
		return {
			async selectChannel() {
				dispatch.imageviewer.clearThumbnails()
			},

			async fetchFirstSlice() {
				dispatch.imageviewer.clearThumbnails()
				dispatch.imageviewer.setSliceLoadingCanceled(false)
				const startTime = imageviewerSelectors.startTime(store.getState())
				const endTime = imageviewerSelectors.endTime(store.getState())

				const channel = imageviewerSelectors.channel(store.getState())
				if (channel === undefined) {
					throw new Error('internal error: channel is undefined')
				}
				const channelId = channelToId(channel)
				const queryApis = appcfgSelectors.backendToQueryApi(store.getState())
				const api = queryApis.get(channel.backend)
				if (!api) {
					dispatch.applog.log(make_error(`no api provider for ${channelId}`))
					throw new Error(`no api provider for ${channelId}`)
				}

				let ts = startTime
				while (
					ts < endTime &&
					!imageviewerSelectors.sliceLoadingCanceled(store.getState())
				) {
					const slice = await fetchSlice(dispatch, channel, api, ts)
					if (slice.length > 0) {
						dispatch.imageviewer.addThumbnailSlice(slice)
						break
					}
					ts += SLICE_LENGTH
				}
			},

			async fetchNextSlice() {
				const thumbnails = imageviewerSelectors.thumbnails(store.getState())
				if (thumbnails.length === 0) {
					dispatch.imageviewer.fetchFirstSlice()
					return
				}
				dispatch.imageviewer.setSliceLoadingCanceled(false)
				const startTime = thumbnails[thumbnails.length - 1].x + 1
				const endTime = imageviewerSelectors.endTime(store.getState())

				const channel = imageviewerSelectors.channel(store.getState())
				if (channel === undefined) {
					throw new Error('internal error: channel is undefined')
				}
				const channelId = channelToId(channel)
				const queryApis = appcfgSelectors.backendToQueryApi(store.getState())
				const api = queryApis.get(channel.backend)
				if (!api) {
					dispatch.applog.log(make_error(`no api provider for ${channelId}`))
					throw new Error(`no api provider for ${channelId}`)
				}

				let ts = startTime
				while (
					ts < endTime &&
					!imageviewerSelectors.sliceLoadingCanceled(store.getState())
				) {
					const slice = await fetchSlice(dispatch, channel, api, ts)
					if (slice.length > 0) {
						dispatch.imageviewer.addThumbnailSlice(slice)
						break
					}
					ts += SLICE_LENGTH
				}
			},
		}
	},
})

async function fetchSlice(
	dispatch: AppDispatch,
	channel: DataUiChannel,
	api: DataUiQueryApi,
	startTime: number
) {
	dispatch.imageviewer.channelDataRequest(Date.now())
	dispatch.imageviewer.setCurrentSlice(startTime)
	const startDate = new Date(startTime).toISOString()
	const endTime = startTime + SLICE_LENGTH
	const endDate = new Date(endTime).toISOString()
	try {
		const apiData = await api.queryImageThumbnails(channel, startDate, endDate)
		dispatch.imageviewer.channelDataSuccess(Date.now())
		const thumbnails = apiData.datapoints
		return thumbnails
	} catch (e) {
		const error = e as Error
		dispatch.imageviewer.channelDataFailure({
			timestamp: Date.now(),
			error,
		})
		throw e // notify the outside world of the problem
	}
}

const getState = (state: AppState) => state.imageviewer

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace imageviewerSelectors {
	export const startTime = createSelector([getState], state => state.startTime)
	export const endTime = createSelector([getState], state => state.endTime)
	export const channel = createSelector([getState], state => state.channel)
	export const fetching = createSelector(
		[getState],
		state => state.request.fetching
	)
	export const error = createSelector([getState], state => state.request.error)
	export const thumbnails = createSelector(
		[getState],
		state => state.thumbnails
	)
	export const currentSlice = createSelector(
		[getState],
		state => state.currentSlice
	)
	export const sliceLoadingCanceled = createSelector(
		[getState],
		state => state.sliceLoadingCanceled
	)

	export const canLoadMoreSlices = createSelector(
		[endTime, thumbnails],
		(endTime, thumbnails) => {
			if (thumbnails.length === 0) return false
			const lastTs = thumbnails[thumbnails.length - 1].x
			return lastTs < endTime
		}
	)
}
