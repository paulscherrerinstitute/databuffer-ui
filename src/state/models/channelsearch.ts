import {
	ChannelConfig,
	ChannelConfigsQuery,
} from '@psi/databuffer-query-js/query-channel-configs'
import { createModel } from '@captaincodeman/rdx'
import { Store, State } from '../store'
import { queryRestApi } from '../../api/queryrest'
import { channelToId } from '@psi/databuffer-query-js/channel'
import { createSelector } from 'reselect'
import { compareNameThenBackend, getShapeName } from '../../store/channelsearch'

type IdToChannelMap = { [id: string]: ChannelConfig }

export interface ChannelSearchState {
	pattern: string
	availableBackends: string[]
	selectedBackends: string[]
	entities: IdToChannelMap
	ids: string[]
	fetching: boolean
	error: Error
}

export const channelsearch = createModel({
	state: {
		pattern: '',
		availableBackends: [],
		selectedBackends: [],
		entities: {},
		ids: [],
		fetching: false,
		error: null,
	} as ChannelSearchState,

	reducers: {
		patternChange: (state, newPattern: string) => ({
			...state,
			pattern: newPattern,
		}),
		searchRequest: state => ({
			...state,
			entities: {},
			ids: [],
			fetching: true,
			error: null,
		}),
		searchSuccess: (state, entities: IdToChannelMap) => ({
			...state,
			entities,
			ids: Object.keys(entities).sort(),
			fetching: false,
		}),
		searchFailure: (state, error) => ({ ...state, fetching: false, error }),
	},

	effects: (store: Store) => {
		const dispatch = store.dispatch() // save for later
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
				try {
					// eslint-disable-next-line @typescript-eslint/no-use-before-define
					const entities = await _searchChannel(query)
					dispatch.channelsearch.searchSuccess(entities)
				} catch (err) {
					dispatch.channelsearch.searchFailure(err)
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

const getState = (state: State) => state.channelsearch

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
			resultsWithTags
				.reduce(
					(aggr, current) => [
						...aggr,
						...current.tags.filter(t => !aggr.includes(t)),
					],
					[]
				)
				.sort()
	)

	export const fetching = createSelector([getState], state => state.fetching)

	export const error = createSelector([getState], state => state.error)
}
