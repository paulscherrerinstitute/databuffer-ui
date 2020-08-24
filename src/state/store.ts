/* eslint-disable @typescript-eslint/no-empty-interface */
import {
	createStore,
	ModelStore,
	StoreState,
	StoreDispatch,
	devtools,
} from '@captaincodeman/rdx'

import { config } from './config'

export const store = devtools(createStore(config))
export const dispatch = store.dispatch

// This would technically be possible, but the type hints vscode will provide
// on hover are _not_ helpful (code completion would still work, though):
// StoreState<typeof import("/path/to/models/index")>
//
// So instead I disabled the eslint rule for that
//
// export type State = StoreState<typeof config>
// export type Dispatch = StoreDispatch<typeof config>
// export type Store = ModelStore<Dispatch, State>
export interface State extends StoreState<typeof config> {}
export interface Dispatch extends StoreDispatch<typeof config> {}
export interface Store extends ModelStore<Dispatch, State> {}
