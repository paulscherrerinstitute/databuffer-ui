import { ChannelSearchActions, ChannelTypes } from './actions'
import { IdToChannelMap } from './model'

export interface ChannelSearchState {
	pattern: string
	availableBackends: string[]
	selectedBackends: string[]
	entities: IdToChannelMap
	ids: string[]
	fetching: boolean
	error: Error
}

export const initialState: ChannelSearchState = {
	pattern: '',
	availableBackends: [],
	selectedBackends: [],
	entities: {},
	ids: [],
	fetching: false,
	error: null,
}

export default (
	state: ChannelSearchState = initialState,
	action: ChannelSearchActions
): ChannelSearchState => {
	switch (action.type) {
		case ChannelTypes.CHANNEL_SEARCH:
			return {
				...state,
				pattern: action.payload.pattern,
			}

		case ChannelTypes.CHANNEL_SEARCH_REQUEST:
			return {
				...state,
				entities: {},
				ids: [],
				fetching: true,
				error: null,
			}

		case ChannelTypes.CHANNEL_SEARCH_SUCCESS:
			return {
				...state,
				fetching: false,
				entities: action.payload.entities,
				ids: action.payload.ids,
			}

		case ChannelTypes.CHANNEL_SEARCH_FAILURE:
			return { ...state, fetching: false, error: action.payload.error }

		default:
			return state
	}
}
