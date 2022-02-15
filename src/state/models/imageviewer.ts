import { createModel } from '@captaincodeman/rdx'
import { createSelector } from 'reselect'
import { channelToId, DataUiChannel } from '../../shared/channel'
import type { DataUiDataPoint, DataUiImage } from '../../shared/dataseries'
import type { AppState, EffectsStore } from '../store'
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
	detailImage?: DataUiDataPoint<number, DataUiImage>
}

export const imageviewer = createModel({
	state: {
		startTime: Date.now() - 10_000,
		endTime: Date.now(),
		queryExpansion: false,
		request: { fetching: false },
		thumbnails: [],
		detailImage: undefined,
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
		setThumbnails(
			state: ImageviewerState,
			thumbnails: DataUiDataPoint<number, DataUiImage>[]
		) {
			return { ...state, thumbnails }
		},
		clearDetailImage(state: ImageviewerState) {
			return { ...state, detailImage: undefined }
		},
		setDetailImage(
			state: ImageviewerState,
			detailImage: DataUiDataPoint<number, DataUiImage>
		) {
			return { ...state, detailImage }
		},
	},
	effects(store: EffectsStore) {
		const dispatch = store.getDispatch()
		return {
			async setRange() {
				dispatch.imageviewer.clearThumbnails()
				dispatch.imageviewer.clearDetailImage()
			},
			async setQueryExpansion() {
				dispatch.imageviewer.clearThumbnails()
				dispatch.imageviewer.clearDetailImage()
			},
			async selectChannel() {
				dispatch.imageviewer.clearThumbnails()
				dispatch.imageviewer.clearDetailImage()
			},
			async fetchThumbnails() {
				dispatch.imageviewer.clearThumbnails()
				dispatch.imageviewer.clearDetailImage()
				const startTime = imageviewerSelectors.startTime(store.getState())
				const startDate = new Date(startTime).toISOString()
				const endTime = imageviewerSelectors.endTime(store.getState())
				const endDate = new Date(endTime).toISOString()

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
				dispatch.imageviewer.channelDataRequest(Date.now())
				try {
					const apiData = await api.queryImageThumbnails(
						channel,
						startDate,
						endDate
					)
					dispatch.imageviewer.channelDataSuccess(Date.now())
					const thumbnails = apiData.datapoints
					dispatch.imageviewer.setThumbnails(thumbnails)
				} catch (e) {
					const error = e as Error
					dispatch.imageviewer.channelDataFailure({
						timestamp: Date.now(),
						error,
					})
					throw e // notify the outside world of the problem
				}
			},
			async fetchDetailImage(ts: number) {
				dispatch.imageviewer.clearDetailImage()
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
				dispatch.imageviewer.channelDataRequest(Date.now())
				try {
					const apiData = await api.queryImageAtTimestamp(channel, ts)
					dispatch.imageviewer.channelDataSuccess(Date.now())
					dispatch.imageviewer.setDetailImage({ x: ts, y: apiData })
				} catch (e) {
					const error = e as Error
					dispatch.imageviewer.channelDataFailure({
						timestamp: Date.now(),
						error,
					})
					throw e // notify the outside world of the problem
				}
			},
		}
	},
})

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
	export const detailImage = createSelector(
		[getState],
		state => state.detailImage
	)
}
