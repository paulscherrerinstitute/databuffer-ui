import { combineReducers } from 'redux'
import channelSearch, { ChannelSearchState } from './channelsearch/reducer'
import plot, { PlotState } from './plot/reducer'
import route, { RoutingState } from './routing/reducer'

export interface RootState {
	channelSearch: ChannelSearchState
	plot: PlotState
	route: RoutingState
}

export const rootReducer = combineReducers({
	channelSearch,
	plot,
	route,
})
