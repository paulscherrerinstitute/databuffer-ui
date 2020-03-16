import { Store } from 'redux'
import * as ReselectTools from 'reselect-tools'

import { ChannelSearchSelectors } from './channelsearch'
import { PlotSelectors } from './plot'
import { RoutingSelectors } from './routing'

export const startReselect = (store: Store) => {
	ReselectTools.getStateWith(() => store.getState())
	ReselectTools.registerSelectors(ChannelSearchSelectors)
	ReselectTools.registerSelectors(PlotSelectors)
	ReselectTools.registerSelectors(RoutingSelectors)
}
