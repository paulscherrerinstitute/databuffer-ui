import { createModel } from '@captaincodeman/rdx'
import { createSelector } from 'reselect'
import { AppState } from '../store'
import type { EffectsStore } from '../store'
import { createQueryProvider } from '../../api'
import type { DataUiQueryApi } from '../../api'
import { make_error } from './applog'

type QueryApiProviderInfo = {
	url: string
	api: DataUiQueryApi
	backends: string[]
}

export interface AppcfgState {
	queryApiProviders: QueryApiProviderInfo[]
	queryApiProvidersFetching: boolean
	queryApiProvidersError?: Error
}

export const appcfg = createModel({
	state: {
		queryApiProviders: [],
		queryApiProvidersFetching: false,
		queryApiProvidersError: undefined,
	} as AppcfgState,
	reducers: {
		queryApiProvidersRequest(state: AppcfgState) {
			return {
				...state,
				queryApiProviders: [],
				queryApiProvidersFetching: true,
				queryApiProvidersError: undefined,
			}
		},
		queryApiProvidersSuccess(
			state: AppcfgState,
			queryApiProviders: QueryApiProviderInfo[]
		) {
			return {
				...state,
				queryApiProviders,
				queryApiProvidersFetching: false,
			}
		},
		queryApiProvidersFailure(state: AppcfgState, error: Error) {
			return {
				...state,
				queryApiProvidersFetching: false,
				queryApiProvidersError: error,
			}
		},
	},

	effects(store: EffectsStore) {
		const dispatch = store.getDispatch() // save for later
		return {
			async init() {
				const urls = window.DatabufferUi.QUERY_API.split(/\s+/)

				dispatch.appcfg.queryApiProvidersRequest()

				async function _processApiUrl(url: string) {
					try {
						const api = await createQueryProvider(url)
						const backends = await api?.listBackends()
						return { url, api, backends }
					} catch (e) {
						dispatch.applog.log(
							make_error(`error during initialization for ${url}: ${e}`)
						)
						throw e
					}
				}

				const promises = await Promise.allSettled(
					urls.map(url => _processApiUrl(url))
				)
				const fulfilled = promises.filter(
					p => p.status === 'fulfilled'
				) as PromiseFulfilledResult<QueryApiProviderInfo>[]
				if (fulfilled.length > 0) {
					const apis = fulfilled.map(p => p.value)
					dispatch.appcfg.queryApiProvidersSuccess(apis)
				} else {
					dispatch.appcfg.queryApiProvidersFailure(
						new Error('No query API available')
					)
				}
			},
		}
	},
})

const getState = (state: AppState) => state.appcfg

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace appcfgSelectors {
	export const queryApiProviders = createSelector(
		[getState],
		state => state.queryApiProviders
	)

	export const queryApiProvidersFetching = createSelector(
		[getState],
		state => state.queryApiProvidersFetching
	)

	export const queryApiProvidersError = createSelector(
		[getState],
		state => state.queryApiProvidersError
	)

	export const backendToQueryApi = createSelector(
		[queryApiProviders],
		queryApiProviders => {
			const result = new Map<string, DataUiQueryApi>()
			queryApiProviders.forEach(item => {
				for (const backend of item.backends) {
					if (result.has(backend)) continue
					result.set(backend, item.api)
				}
			})
			return result
		}
	)

	export const availableBackends = createSelector(
		[backendToQueryApi],
		backendToQueryApi => [...backendToQueryApi.keys()].sort()
	)
}
