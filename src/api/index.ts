import { ApiV0QueryProvider } from './apiv0queryprovider'
import type { DataUiQueryApi } from './queryapi'
export type { DataUiQueryApi }
import type { DataUiDispatcherApi } from './dispatcherapi'
export type { DataUiDispatcherApi }
import { ApiV0DispatcherProvider } from './apiv0dispatcherprovider'

/**
 * factory method for DataUiQueryApi objects
 * @param url
 * @returns a Promise that resolves to an DataUiQueryApi
 */
export const createQueryProvider = async (
	url: string
): Promise<DataUiQueryApi> => {
	// TODO: try to determine api version from known endpoints
	// const resp = await fetch(`${url}/meta`)
	// if (resp.ok) {
	// 	const meta = await resp.json()
	// 	if (meta.apiversion && meta.apiversion === '4') {
	// 		return new ApiV4QueryProvider(url)
	// 	}
	//	throw new Error(`api version of ${url} not supported: ${meta.apiversion}`)
	// }
	// no enpoint found? fall back to APIv0 (which doesn't have such an endpoint)
	return new ApiV0QueryProvider(url)
}

/**
 * factory method for DataUiDispatcherApi objects
 * @param url
 * @returns a Promise that resolves to an DataUiDispatcherApi
 */
export const createDispatcherProvider = async (
	url: string
): Promise<DataUiDispatcherApi> => {
	// TODO: try to determine api version from known endpoints
	// const resp = await fetch(`${url}/meta`)
	// if (resp.ok) {
	// 	const meta = await resp.json()
	// 	if (meta.apiversion && meta.apiversion === '4') {
	// 		return new ApiV4DispatcherProvider(url)
	// 	}
	//	throw new Error(`api version of ${url} not supported: ${meta.apiversion}`)
	// }
	// no enpoint found? fall back to APIv0 (which doesn't have such an endpoint)
	return new ApiV0DispatcherProvider(url)
}
