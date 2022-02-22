import { createModel } from '@captaincodeman/rdx'
import { createSelector } from 'reselect'
import { AppState } from '../store'
import type { EffectsStore } from '../store'
import { createDispatcherProvider, createQueryProvider } from '../../api'
import type { DataUiDispatcherApi, DataUiQueryApi } from '../../api'
import { make_error } from './applog'

type DispatcherApiProviderInfo = {
	url: string
	api: DataUiDispatcherApi
	backends: string[]
}

type QueryApiProviderInfo = {
	url: string
	api: DataUiQueryApi
	backends: string[]
}

export interface AppcfgState {
	dispatcherApiProviders: DispatcherApiProviderInfo[]
	dispatcherApiProvidersFetching: boolean
	dispatcherApiProvidersError?: Error
	queryApiProviders: QueryApiProviderInfo[]
	queryApiProvidersFetching: boolean
	queryApiProvidersError?: Error
	initFinished: boolean
}

export const appcfg = createModel({
	state: {
		dispatcherApiProviders: [],
		dispatcherApiProvidersFetching: false,
		dispatcherApiProvidersError: undefined,
		queryApiProviders: [],
		queryApiProvidersFetching: false,
		queryApiProvidersError: undefined,
		initFinished: false,
	} as AppcfgState,
	reducers: {
		dispatcherApiProvidersRequest(state: AppcfgState) {
			return {
				...state,
				dispatcherApiProviders: [],
				dispatcherApiProvidersFetching: true,
				dispatcherApiProvidersError: undefined,
			}
		},
		dispatcherApiProvidersSuccess(
			state: AppcfgState,
			dispatcherApiProviders: DispatcherApiProviderInfo[]
		) {
			return {
				...state,
				dispatcherApiProviders,
				dispatcherApiProvidersFetching: false,
			}
		},
		dispatcherApiProvidersFailure(state: AppcfgState, error: Error) {
			return {
				...state,
				dispatcherApiProvidersFetching: false,
				dispatcherApiProvidersError: error,
			}
		},
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
		setInitFinished(state: AppcfgState, initFinished: boolean) {
			return {
				...state,
				initFinished,
			}
		},
	},

	effects(store: EffectsStore) {
		const dispatch = store.getDispatch() // save for later
		return {
			async init() {
				const urls = window.DatabufferUi.QUERY_API.split(/\s+/)

				dispatch.appcfg.queryApiProvidersRequest()

				async function _processQueryApiUrl(url: string) {
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

				async function _deriveDispatcherApis(
					queryApis: QueryApiProviderInfo[]
				) {
					const promises = queryApis.map(async q => {
						const url = q.url.replace('/data-api.', '/dispatcher-api.')
						if (url === q.url) return null
						const result: DispatcherApiProviderInfo = {
							api: await createDispatcherProvider(url),
							backends: q.backends,
							url,
						}
						return result
					})
					const dispatcherApis = (await Promise.all(promises)).filter(
						x => x !== null
					) as DispatcherApiProviderInfo[]
					return dispatcherApis
				}

				const promises = await Promise.allSettled(
					urls.map(url => _processQueryApiUrl(url))
				)
				const fulfilled = promises.filter(
					p => p.status === 'fulfilled'
				) as PromiseFulfilledResult<QueryApiProviderInfo>[]
				if (fulfilled.length > 0) {
					const apis = fulfilled.map(p => p.value)
					dispatch.appcfg.queryApiProvidersSuccess(apis)
					// not ideal, but while dispatcher api does not provide a way to
					// list backends, we get the query apis first, and then we try
					// to guess the corresponding dispatcher api
					const dispatcherApis = await _deriveDispatcherApis(apis)
					dispatch.appcfg.dispatcherApiProvidersSuccess(dispatcherApis)
				} else {
					dispatch.appcfg.queryApiProvidersFailure(
						new Error('No query API available')
					)
				}
				// whatever the results, we're done with init now
				dispatch.appcfg.setInitFinished(true)
			},
		}
	},
})

const getState = (state: AppState) => state.appcfg

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace appcfgSelectors {
	export const dispatcherApiProviders = createSelector(
		[getState],
		state => state.dispatcherApiProviders
	)

	export const dispatcherApiProvidersFetching = createSelector(
		[getState],
		state => state.dispatcherApiProvidersFetching
	)

	export const dispatcherApiProvidersError = createSelector(
		[getState],
		state => state.dispatcherApiProvidersError
	)

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

	export const initFinished = createSelector(
		[getState],
		state => state.initFinished
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

	export const backendToDispatcherApi = createSelector(
		[dispatcherApiProviders],
		dispatcherApiProviders => {
			const result = new Map<string, DataUiDispatcherApi>()
			dispatcherApiProviders.forEach(item => {
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

	export const canSearchChannels = createSelector(
		[initFinished, availableBackends],
		(initFinished, availableBackends) =>
			initFinished && availableBackends.length > 0
	)
}
