import {
	ChannelConfig,
	ChannelConfigsQuery,
} from '@psi/databuffer-query-js/query-channel-configs'
import { createModel, RoutingState } from '@captaincodeman/rdx'
import { channelToId } from '@psi/databuffer-query-js/channel'
import { createSelector } from 'reselect'
import { EffectsStore, AppState } from '../store'
import { queryRestApi } from '../../api/queryrest'
import { ROUTE } from '../routing'
import { compareNameThenBackend } from '../../shared/channel'

export type { ChannelConfig }

export interface ChannelWithTags extends ChannelConfig {
	tags: string[]
}

export enum ShapeName {
	SCALAR = 'scalar',
	WAVEFORM = '1d',
	IMAGE = '2d',
}

export const getShapeName = (c: ChannelConfig): ShapeName => {
	if (c.shape.length > 2)
		throw new Error(`shape has too many dimensions: ${JSON.stringify(c.shape)}`)
	if (c.shape.length === 0)
		throw new Error(`channel has no shape: ${c.backend}/${c.name}`)
	if (c.shape.length === 2) return ShapeName.IMAGE
	if (c.shape[0] === 1) return ShapeName.SCALAR
	return ShapeName.WAVEFORM
}

export type IdToChannelMap = { [id: string]: ChannelConfig }

export interface ChannelSearchState {
	pattern: string
	availableBackends: string[]
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
				try {
					// eslint-disable-next-line @typescript-eslint/no-use-before-define
					const entities = await _searchChannel(query)
					dispatch.channelsearch.searchSuccess(entities)
				} catch (err) {
					dispatch.channelsearch.searchFailure(err)
				}
			},

			async 'routing/change'(payload: RoutingState) {
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
	const response = await queryRestApi.queryChannelConfigs(query)

	const result: IdToChannelMap = {}

	for (const x of response) {
		for (const chConfig of x.channels) {
			const { backend, name } = chConfig
			const id = channelToId({ backend, name })
			result[id] = chConfig
		}
	}

	return result
}

const getState = (state: AppState) => state.channelsearch

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace channelsearchSelectors {
	export const pattern = createSelector([getState], state => state.pattern)

	export const availableBackends = createSelector(
		[getState],
		state => state.availableBackends
	)

	export const selectedBackends = createSelector(
		[getState],
		state => state.selectedBackends
	)

	const resultEntities = createSelector([getState], state => state.entities)

	export const results = createSelector([resultEntities], entities =>
		Object.values(entities).sort(compareNameThenBackend)
	)

	export const resultsWithTags = createSelector([results], results =>
		results.map(x => ({ ...x, tags: [x.backend, getShapeName(x)] }))
	)

	export const availableTags = createSelector(
		[resultsWithTags],
		resultsWithTags =>
			Array.from(new Set(resultsWithTags.flatMap(x => x.tags))).sort()
	)

	export const fetching = createSelector([getState], state => state.fetching)

	export const error = createSelector([getState], state => state.error)
}
