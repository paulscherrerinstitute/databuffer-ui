import { createModel } from '@captaincodeman/rdx'
import { createSelector } from 'reselect'
import { AppState } from '../store'

export const APPLOG_OFF = 0
export const APPLOG_ERROR = 1
export const APPLOG_WARNING = 10
export const APPLOG_INFO = 100
export const APPLOG_DEBUG = 1000

export const MAX_ENTRIES = 10000

export type ApplogEntry = {
	ts: number
	severity: number
	message: string
}

const make_log_entry = (severity: number, message: string): ApplogEntry => ({
	ts: Date.now(),
	severity,
	message,
})

export const make_debug = (message: string) =>
	make_log_entry(APPLOG_DEBUG, message)
export const make_info = (message: string) =>
	make_log_entry(APPLOG_INFO, message)
export const make_warning = (message: string) =>
	make_log_entry(APPLOG_WARNING, message)
export const make_error = (message: string) =>
	make_log_entry(APPLOG_ERROR, message)

export interface ApplogState {
	entries: ApplogEntry[]
	capacity: number
	logThreshold: number
}

export const applog = createModel({
	state: {
		entries: [],
		capacity: 1000,
		logThreshold: APPLOG_WARNING,
	} as ApplogState,
	reducers: {
		setCapacity(state: ApplogState, capacity: number) {
			return {
				...state,
				capacity: capacity < 0 ? 0 : Math.min(capacity, MAX_ENTRIES),
				entries:
					state.entries.length < capacity
						? state.entries
						: state.entries.slice(0, capacity),
			}
		},
		setThreshold(state: ApplogState, threshold: number) {
			return {
				...state,
				threshold: threshold < 0 ? 0 : threshold,
			}
		},
		clear(state: ApplogState) {
			return { ...state, entries: [] }
		},
		log(state: ApplogState, entry: ApplogEntry) {
			if (state.logThreshold < entry.severity) return state
			return {
				...state,
				entries: [entry, ...state.entries].slice(0, state.capacity),
			}
		},
	},
})

const getState = (state: AppState) => state.applog

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace applogSelectors {
	export const capacity = createSelector([getState], state => state.capacity)
	export const logThreshold = createSelector(
		[getState],
		state => state.logThreshold
	)
	export const entries = createSelector([getState], state => state.entries)
}
