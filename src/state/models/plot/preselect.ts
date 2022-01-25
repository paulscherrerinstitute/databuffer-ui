//this module handles all the stuff about the /preselect route

import { RoutingState } from '@captaincodeman/rdx'
import { parseISO } from 'date-fns'

import type { DataUiQueryApi } from '../../../api/queryapi'
import {
	channelToId,
	DataUiChannel,
	idToChannel,
} from '../../../shared/channel'
import { ROUTE } from '../../routing'
import { AppDispatch } from '../../store'
import { make_info } from '../applog'

import { isPlotVariation, isYAxisType, PlotVariation, YAxisType } from './types'

export type QueryParams = { [key: string]: string | string[] } | undefined

export const extractStartEndTime = (
	q: QueryParams
): { startTime: number; endTime: number } => {
	const strToDate = (s: string): number =>
		/^\d+$/.test(s) ? Number.parseInt(s, 10) : parseISO(s).getTime()
	let duration = 12 * 60 * 60 * 1000 // default: 12 hours
	let endTime = Date.now()
	let startTime = endTime - duration
	if (q?.duration) {
		duration = Number.parseInt(q.duration as string, 10)
		startTime = endTime - duration
	}
	if (q?.endTime) {
		endTime = strToDate(q.endTime as string)
	}
	if (q?.startTime) {
		startTime = strToDate(q.startTime as string)
	}
	return {
		endTime,
		startTime,
	}
}

export type PreselectDataSeriesConfig = {
	channel: DataUiChannel
	label?: string
	yMax?: number
	yMin?: number
	yAxisType?: YAxisType
}

export const extractPreselectDataSeriesConfig = (
	q: QueryParams,
	i: number
): PreselectDataSeriesConfig | undefined => {
	if (!q) return undefined
	let paramName = `c${i}`
	if (!q[paramName]) return undefined
	const item: PreselectDataSeriesConfig = {
		channel: idToChannel(q[paramName] as string),
		label: q[`l${i}`] as string,
	}
	paramName = `y${i}`
	if (q[paramName]) {
		const s = q[paramName] as string
		if (isYAxisType(s)) {
			item.yAxisType = s
		}
	}
	paramName = `min${i}`
	if (q[paramName]) {
		const s = q[paramName] as string
		const n = Number.parseFloat(s)
		if (!isNaN(n)) {
			item.yMin = n
		}
	}
	paramName = `max${i}`
	if (q[paramName]) {
		const s = q[paramName] as string
		const n = Number.parseFloat(s)
		if (!isNaN(n)) {
			item.yMax = n
		}
	}
	return item
}

export type PreselectParams = {
	startTime: number
	endTime: number
	queryExpansion: boolean
	title?: string
	plotVariation: PlotVariation
	items: PreselectDataSeriesConfig[]
}

export const extractPreselectParams = (
	q: QueryParams
): PreselectParams | undefined => {
	if (q === undefined) return undefined
	const queryExpansion = q.queryExpansion === '1'
	const { startTime, endTime } = extractStartEndTime(q)
	const p: PreselectParams = {
		endTime,
		startTime,
		queryExpansion,
		plotVariation: PlotVariation.SeparateAxes,
		items: [],
	}
	if (q.title) {
		p.title = q.title as string
	}
	if (isPlotVariation(q.plotVariation)) {
		p.plotVariation = q.plotVariation
	}
	// extract the data series config items
	const MAX_CHANNELS = 16
	for (let i = 1; i <= MAX_CHANNELS; i++) {
		const item = extractPreselectDataSeriesConfig(q, i)
		if (!item) continue
		p.items.push(item)
	}
	return p
}

async function getChannelConfig(
	backend: string,
	name: string,
	api: DataUiQueryApi
): Promise<DataUiChannel | undefined> {
	const re = `^${name}$`
	const temp = await api.searchChannels(re)
	for (const it of temp) {
		if (it.backend !== backend) continue
		if (it.name !== name) continue
		return it
	}
	return undefined
}

async function configureDataSeries(
	dispatch: AppDispatch,
	index: number,
	item: PreselectDataSeriesConfig
): Promise<void> {
	if (item.yAxisType) {
		dispatch.plot.setAxisType({ index, type: item.yAxisType })
	}
	if (item.yMin) {
		dispatch.plot.setAxisMin({ index, min: item.yMin })
	}
	if (item.yMax) {
		dispatch.plot.setAxisMax({ index, max: item.yMax })
	}
	if (item.label) {
		dispatch.plot.changeDataSeriesLabel({
			index,
			label: item.label,
		})
	}
}

/**
 * The /preselect URL allows to configure the entire display of the plot via parameters.
 *
 * This function needs to verify all the URL parameters are sensible and provide good data.
 * To do that it needs to search for the configuration of each channel, as (at least) the type
 * information will be crucial to plotting the data (i.e. for strings vs numbers).
 *
 * @param dispatch
 * @param routingState
 * @returns
 */
export async function handleRoutePreselect(
	dispatch: AppDispatch,
	routingState: RoutingState<ROUTE>,
	queryApiMap: Map<string, DataUiQueryApi>
) {
	// if there are no query params, start over at home view
	const params = extractPreselectParams(routingState.queries)
	if (!params) {
		dispatch.routing.replace('/')
		return
	}

	if (params.plotVariation) {
		dispatch.plot.changePlotVariation(params.plotVariation)
	}
	dispatch.plot.changeEndTime(params.endTime)
	dispatch.plot.changeStartTime(params.startTime)
	if (params.title) {
		dispatch.plot.changePlotTitle(params.title)
	}
	dispatch.plot.setQueryExpansion(params.queryExpansion)

	const configPromises = params.items.map(async item => {
		const api = queryApiMap.get(item.channel.backend)
		if (!api) {
			dispatch.applog.log(
				make_info(`no api configured for: ${channelToId(item.channel)}`)
			)
			return undefined
		}
		const c = await getChannelConfig(
			item.channel.backend,
			item.channel.name,
			api
		)
		if (!c) {
			dispatch.applog.log(
				make_info(`channel not found: ${channelToId(item.channel)}`)
			)
			return undefined
		}
		return c
	})
	// sync up after collecting the configs
	// before configuring the plot, to keep order of channels
	const cfgs = await Promise.all(configPromises)
	// need a separate index for the channels that have a configuration
	// because maybe one of them counldn't be found, and then it won't be
	// selected (selectChannel)
	// i.e. if 5 channels were requested by URL params, but only 3 have
	// a configuration, then in the state there must be only index 0..2.
	let index = 0
	for (let i = 0; i < params.items.length; i++) {
		const c = cfgs[i]
		if (!c) continue
		dispatch.plot.selectChannel(c)
		const item = params.items[i]
		configureDataSeries(dispatch, index, item)
		index++
	}

	dispatch.plot.drawPlot()
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	dispatch.routing.replace('/plot')
}
