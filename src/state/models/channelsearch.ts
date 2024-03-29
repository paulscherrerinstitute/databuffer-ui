import { ChannelConfigsQuery } from '@paulscherrerinstitute/databuffer-query-js/api/v0/query-channel-configs'
import { createModel, RoutingState } from '@captaincodeman/rdx'
import { createSelector } from 'reselect'
import { EffectsStore, AppState } from '../store'
import type { DataUiQueryApi } from '../../api/queryapi'
import { ROUTE } from '../routing'
import {
	channelToId,
	compareNameThenBackend,
	DataUiChannel,
} from '../../shared/channel'
import { appcfgSelectors } from './appcfg'
import { make_error } from './applog'

export type IdToChannelMap = { [id: string]: DataUiChannel }

export interface ChannelSearchState {
	pattern: string
	selectedBackends: string[]
	entities: IdToChannelMap
	ids: string[]
	fetching: boolean
	error?: Error
}

export const channelsearch = createModel({
	state: {
		pattern: '',
		selectedBackends: [],
		entities: {},
		ids: [],
		fetching: false,
		error: undefined,
	} as ChannelSearchState,

	reducers: {
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
				const apiProviders = appcfgSelectors.queryApiProviders(store.getState())
				// first query all api providers
				const promises = await Promise.allSettled(
					apiProviders.map(item => {
						try {
							const result = _searchChannel(query, item.api)
							return result
						} catch (e) {
							dispatch.applog.log(
								make_error(`error searching channels in ${item.url}`)
							)
							throw e
						}
					})
				)
				const fulfilled = promises.filter(
					p => p.status === 'fulfilled'
				) as PromiseFulfilledResult<IdToChannelMap>[]
				if (fulfilled.length > 0) {
					// then remove duplicates
					const allEntities = fulfilled.map(p => p.value)
					const entities = allEntities.reduce(
						(prev, curr) => ({ ...curr, ...prev }),
						{}
					)
					dispatch.channelsearch.searchSuccess(entities)
				} else {
					dispatch.channelsearch.searchFailure(
						new Error('No query API available')
					)
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
	query: ChannelConfigsQuery,
	api: DataUiQueryApi
): Promise<IdToChannelMap> {
	const channels = await api.searchChannels(query.regex)
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
