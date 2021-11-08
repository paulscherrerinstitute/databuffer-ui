import { createModel } from '@captaincodeman/rdx'
import { createSelector } from 'reselect'
import { AppState } from '../store'
import type { EffectsStore } from '../store'
import { createDataApiProvider } from '../../api/queryrest'
import type { DataApiProvider } from '../../api/queryrest'

export interface AppcfgState {
	queryUrls: string[]
	backendToQueryApi: Record<string, DataApiProvider>
	initialized: boolean
}

export const appcfg = createModel({
	state: {
		queryUrls: [],
		backendToQueryApi: {},
		initialized: false,
	} as AppcfgState,
	reducers: {
		setQueryUrls(state: AppcfgState, queryUrls: string[]) {
			return { ...state, queryUrls }
		},

		clearBackendToQueryApiProviders(state: AppcfgState) {
			return { ...state, backendToQueryApi: {} }
		},

		addBackendToQueryApiProvider(
			state: AppcfgState,
			payload: { backend: string; api: DataApiProvider }
		) {
			return {
				...state,
				backendToQueryApi: {
					...state.backendToQueryApi,
					[payload.backend]: payload.api,
				},
			}
		},

		setInitialized(state: AppcfgState, initialized: boolean) {
			return { ...state, initialized }
		},
	},

	effects(store: EffectsStore) {
		const dispatch = store.getDispatch() // save for later
		return {
			async init() {
				const urls = window.DatabufferUi.QUERY_API.split(/\s+/)
				dispatch.appcfg.setQueryUrls(urls)
			},

			async setQueryUrls() {
				dispatch.appcfg.setInitialized(false)
				dispatch.appcfg.clearBackendToQueryApiProviders()
				const state = store.getState()
				const urls = appcfgSelectors.queryUrls(state)

				type ResultItem = {
					api?: DataApiProvider
					backends?: string[]
				}
				const results: ResultItem[] = new Array(urls.length)
				async function processApiUrl(url: string, index: number) {
					const api = await createDataApiProvider(url)
					const backends = await api.listBackends()
					results[index] = { api, backends }
				}

				await Promise.all(urls.map((url, index) => processApiUrl(url, index)))

				// Now, that all API providers have been created and queried for
				// their backends, setup the mappinig from backends to API providers.
				// Process them in the order of the original config setting of the
				// URLs, i.e. the first one that provides a backend wins (for that backend).
				const seenBackends = new Set<string>()
				for (const x of results) {
					if (!x.api) continue // skip if no API provider could be created
					if (!x.backends) continue // skip if backends could not be queried
					for (const backend of x.backends) {
						if (seenBackends.has(backend)) continue // skip if we alread added this backend
						seenBackends.add(backend)
						dispatch.appcfg.addBackendToQueryApiProvider({
							backend,
							api: x.api,
						})
					}
				}
				dispatch.appcfg.setInitialized(true)
			},
		}
	},
})

const getState = (state: AppState) => state.appcfg

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace appcfgSelectors {
	export const initialized = createSelector(
		[getState],
		state => state.initialized
	)
	export const queryUrls = createSelector([getState], state => state.queryUrls)
	export const backendToQueryApi = createSelector(
		[getState],
		state => state.backendToQueryApi
	)
	export const availableBackends = createSelector(
		[backendToQueryApi],
		backendToQueryApi => Object.keys(backendToQueryApi)
	)
}
