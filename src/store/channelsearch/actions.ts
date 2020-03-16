import { createAction, ActionsUnion } from '../actions'
import { IdToChannelMap } from './model'

export enum ChannelTypes {
	CHANNEL_SELECT = 'CHANNEL_SELECT',

	CHANNEL_SEARCH = 'CHANNEL_SEARCH',
	CHANNEL_SEARCH_REQUEST = 'CHANNEL_SEARCH_REQUEST',
	CHANNEL_SEARCH_SUCCESS = 'CHANNEL_SEARCH_SUCCESS',
	CHANNEL_SEARCH_FAILURE = 'CHANNEL_SEARCH_FAILURE',
}

export const ChannelSearchActions = {
	selectChannel: (id: string) =>
		createAction(ChannelTypes.CHANNEL_SELECT, { id }),

	searchChannel: (pattern: string) =>
		createAction(ChannelTypes.CHANNEL_SEARCH, { pattern }),
	searchChannelRequest: (pattern: string) =>
		createAction(ChannelTypes.CHANNEL_SEARCH_REQUEST, { pattern }),
	searchChannelSuccess: (ids: string[], entities: IdToChannelMap) =>
		createAction(ChannelTypes.CHANNEL_SEARCH_SUCCESS, { ids, entities }),
	searchChannelFailure: (error: Error) =>
		createAction(ChannelTypes.CHANNEL_SEARCH_FAILURE, { error }),
}

export type ChannelSearchActions = ActionsUnion<typeof ChannelSearchActions>
