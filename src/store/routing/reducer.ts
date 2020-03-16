import { routerReducer } from 'redux-first-routing'

export interface RoutingState {
	pathname: string
	search: string
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	queries: any
	hash: string
}

export default routerReducer
