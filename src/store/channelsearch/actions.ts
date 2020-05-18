import { createAction, ActionsUnion } from '../actions'
import { IdToChannelMap } from './model'

export enum ChannelTypes {
	CHANNEL_SELECT = 'CHANNEL_SELECT',

	PATTERN_CHANGE = 'PATTERN_CHANGE',

	CHANNEL_SEARCH = 'CHANNEL_SEARCH',
	CHANNEL_SEARCH_REQUEST = 'CHANNEL_SEARCH_REQUEST',
	CHANNEL_SEARCH_SUCCESS = 'CHANNEL_SEARCH_SUCCESS',
	CHANNEL_SEARCH_FAILURE = 'CHANNEL_SEARCH_FAILURE',
}

export const ChannelSearchActions = {
	selectChannel: (id: string) =>
		createAction(ChannelTypes.CHANNEL_SELECT, { id }),

	patternChange: (pattern: string) =>
		createAction(ChannelTypes.PATTERN_CHANGE, { pattern }),

	searchChannel: () => createAction(ChannelTypes.CHANNEL_SEARCH),
	searchChannelRequest: () => createAction(ChannelTypes.CHANNEL_SEARCH_REQUEST),
	searchChannelSuccess: (ids: string[], entities: IdToChannelMap) =>
		createAction(ChannelTypes.CHANNEL_SEARCH_SUCCESS, { ids, entities }),
	searchChannelFailure: (error: Error) =>
		createAction(ChannelTypes.CHANNEL_SEARCH_FAILURE, { error }),
}

export type ChannelSearchActions = ActionsUnion<typeof ChannelSearchActions>
