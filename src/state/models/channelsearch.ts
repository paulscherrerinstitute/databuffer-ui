import { ChannelConfigsQuery } from '@paulscherrerinstitute/databuffer-query-js/api/v0/query-channel-configs'
import { createModel, RoutingState } from '@captaincodeman/rdx'
import { createSelector } from 'reselect'
import { EffectsStore, AppState } from '../store'
import { queryRestApi } from '../../api/queryrest'
import { ROUTE } from '../routing'
import {
	channelToId,
	compareNameThenBackend,
	DataUiChannel,
} from '../../shared/channel'

export type IdToChannelMap = { [id: string]: DataUiChannel }

export interface ChannelSearchState {
	pattern: string
	availableBackends: string[]
	availableBackendsFetching: boolean
	availableBackendsError?: Error
	selectedBackends: string[]
	entities: IdToChannelMap
	ids: string[]
	fetching: boolean
	error?: Error
}

export const channelsearch = createModel({
	state: {
		pattern: '',
		availableBackends: [],
		availableBackendsFetching: false,
		availableBackendsError: undefined,
		selectedBackends: [],
		entities: {},
		ids: [],
		fetching: false,
		error: undefined,
	} as ChannelSearchState,

	reducers: {
		availableBackendsRequest(state) {
			return {
				...state,
				availableBackends: [],
				availableBackendsFetching: true,
				availableBackendsError: undefined,
			}
		},
		availableBackendsSuccess(state, availableBackends: string[]) {
			return { ...state, availableBackends, availableBackendsFetching: false }
		},
		availableBackendsError(state, error) {
			return {
				...state,
				availableBackendsFetching: false,
				availableBackendsError: error,
			}
		},
		patternChange(state, newPattern: string) {
			return {
				...state,
				pattern: newPattern,
			}
		},
		searchRequest(state) {
			return {
				...state,
				entities: {},
				ids: [],
				fetching: true,
				error: undefined,
			}
		},
		searchSuccess(state, entities: IdToChannelMap) {
			return {
				...state,
				entities,
				ids: Object.keys(entities).sort(),
				fetching: false,
			}
		},
		searchFailure(state, error) {
			return { ...state, fetching: false, error }
		},
	},

	effects(store: EffectsStore) {
		const dispatch = store.getDispatch() // save for later
		return {
			async init() {
				dispatch.channelsearch.availableBackendsRequest()
				try {
					const backends = await queryRestApi.listBackends()
					dispatch.channelsearch.availableBackendsSuccess(backends)
				} catch (err) {
					dispatch.channelsearch.availableBackendsError(err)
				}
			},

			async runSearch() {
				const pattern = store.getState().channelsearch.pattern
				// TODO: do we really want to select / disable backends?
				// const backends = store.getState().channelsearch.selectedBackends
				const query: ChannelConfigsQuery = {
					regex: pattern,
					// backends,
				}
				dispatch.channelsearch.searchRequest()
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				if (store.getState().routing.page !== ROUTE.CHANNEL_SEARCH) {
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					dispatch.routing.push('/search')
				}
				try {
					// eslint-disable-next-line @typescript-eslint/no-use-before-define
					const entities = await _searchChannel(query)
					dispatch.channelsearch.searchSuccess(entities)
				} catch (err) {
					dispatch.channelsearch.searchFailure(err)
				}
			},

			async 'routing/change'(payload: RoutingState<ROUTE>) {
				switch (payload.page) {
					case ROUTE.CHANNEL_SEARCH:
						if (payload.queries && payload.queries.q) {
							dispatch.channelsearch.patternChange(payload.queries.q as string)
							dispatch.channelsearch.runSearch()
						}
						break
				}
			},
		}
	},
})

export async function _searchChannel(
	query: ChannelConfigsQuery
): Promise<IdToChannelMap> {
	const channels = await queryRestApi.searchChannels(query.regex)
	const result: IdToChannelMap = {}
	for (const ch of channels) {
		const id = channelToId(ch)
		result[id] = ch
	}
	return result
}

const getState = (state: AppState) => state.channelsearch

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace channelsearchSelectors {
	export const pattern = createSelector([getState], state => state.pattern)

	export const availableBackends = createSelector([getState], state =>
		[...state.availableBackends].sort()
	)
	export const availableBackendsFetching = createSelector(
		[getState],
		state => state.availableBackendsFetching
	)
	export const availableBackendsError = createSelector(
		[getState],
		state => state.availableBackendsError
	)

	export const selectedBackends = createSelector(
		[getState],
		state => state.selectedBackends
	)

	const resultEntities = createSelector([getState], state => state.entities)

	export const results = createSelector([resultEntities], entities =>
		Object.values(entities).sort(compareNameThenBackend)
	)

	export const availableTags = createSelector([results], results =>
		Array.from(new Set(results.flatMap(x => x.tags))).sort()
	)

	export const fetching = createSelector([getState], state => state.fetching)

	export const error = createSelector([getState], state => state.error)
}
