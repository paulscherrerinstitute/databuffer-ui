/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */
import { put } from 'redux-saga/effects'

import { ChannelSearchActions } from '../channelsearch'
import { PlotActions } from '../plot/actions'
import { Channel } from '../plot/models'
import { RoutingActions } from './actions'
import { idToChannel } from '@psi/databuffer-query-js/channel'
import { parseISO } from 'date-fns'

export const routes = [
	{ path: '/search', route: channelSearchRoute },
	{ path: '/plot/:backend/:name', route: plotSingleChannelRoute },
	{ path: '/preselect', route: plotPreselectRoute },
]

function* channelSearchRoute(params, queries) {
	const { q } = queries
	if (q) {
		yield put(ChannelSearchActions.patternChange(q))
		yield put(ChannelSearchActions.searchChannel())
	}
}

function* plotSingleChannelRoute(params, queries) {
	const channel: Channel = params
	yield put(PlotActions.setSelectedChannels([channel]))
	yield put(RoutingActions.replace('/plot'))
}

export function* plotPreselectRoute(params, queries) {
	const MAX_CHANNELS = 16
	const strToDate = (s: string): number =>
		/^\d+$/.test(s) ? Number.parseInt(s, 10) : parseISO(s).getTime()

	let duration = 12 * 60 * 60 * 1000 // 12 hours
	let endTime = Date.now()
	let startTime = endTime - duration
	if ('duration' in queries) {
		duration = Number.parseInt(queries.duration, 10)
		startTime = endTime - duration
	}
	if ('endTime' in queries) {
		endTime = strToDate(queries.endTime)
	}
	if ('startTime' in queries) {
		startTime = strToDate(queries.startTime)
	}

	const channels: Channel[] = []
	for (let i = 1; i <= MAX_CHANNELS; i++) {
		const paramName = `c${i}`
		if (!queries[paramName]) continue
		channels.push(idToChannel(queries[paramName]))
	}
	yield put(PlotActions.setSelectedChannels(channels))
	yield put(PlotActions.endTimeChange(endTime))
	yield put(PlotActions.startTimeChange(startTime))
	yield put(PlotActions.drawPlot())
	yield put(RoutingActions.replace('/plot'))
}
