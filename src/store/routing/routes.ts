/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */
import { put } from 'redux-saga/effects'

import { ChannelSearchActions } from '../channelsearch'
import { PlotActions } from '../plot/actions'
import { Channel } from '../plot/models'
import { RoutingActions } from './actions'

export const routes = [
	{ path: '/search', route: channelSearchRoute },
	{ path: '/plot/:backend/:name', route: plotSingleChannelRoute },
]

function* channelSearchRoute(params, queries) {
	const { q } = queries
	yield put(ChannelSearchActions.searchChannel(q))
}

function* plotSingleChannelRoute(params, queries) {
	const channel: Channel = params
	yield put(PlotActions.setSelectedChannels([channel]))
	yield put(RoutingActions.replace('/plot'))
}
