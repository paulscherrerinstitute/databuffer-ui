// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../ui/global.d.ts" />

import { QueryRest } from '@paulscherrerinstitute/databuffer-query-js/api/v0'
import type {
	DataResponse,
	ChannelNamesResponse,
} from '@paulscherrerinstitute/databuffer-query-js/api/v0'
import {
	channelToId,
	dataShapeDisplay,
	DataUiChannel,
	DataUiChannelShape,
} from '../shared/channel'
import {
	AggregationOperation,
	AggregationResult,
	EventField,
} from '@paulscherrerinstitute/databuffer-query-js/api/v0/query-data'
import { ChannelConfig } from '@paulscherrerinstitute/databuffer-query-js/api/v0/query-channel-configs/response'
import {
	DataUiAggregatedValue,
	DataUiDataPoint,
	DataUiDataSeries,
} from '../shared/dataseries'

export const NR_OF_BINS = 500
export type { DataResponse, ChannelNamesResponse }

export interface DataApiProvider {
	apiVersion: () => string
	listBackends: () => Promise<string[]>
	queryStringData: (
		channel: DataUiChannel,
		start: string,
		end: string
	) => Promise<DataUiDataSeries<number, string>>
	queryData: (
		channel: DataUiChannel,
		start: string,
		end: string
	) => Promise<DataUiDataSeries<number, DataUiAggregatedValue>>
	searchChannels: (nameRegex?: string) => Promise<DataUiChannel[]>
}

export const createDataApiProvider = async (
	url: string
): Promise<DataApiProvider> => {
	// TODO: try to determine api version from known endpoints
	// const resp = await fetch(`${url}/meta`)
	// if (resp.ok) {
	// 	const meta = await resp.json()
	// 	if (meta.apiversion && meta.apiversion === '4') {
	// 		return new ApiV4QueryProvider(url)
	// 	}
	//	throw new Error(`api version of ${url} not supported: ${meta.apiversion}`)
	// }
	// no enpoint found? fall back to APIv0 (which doesn't have such an endpoint)
	return new ApiV0QueryProvider(url)
}

export class ApiV0QueryProvider implements DataApiProvider {
	private api: QueryRest

	constructor(private url: string) {
		this.api = new QueryRest(url)
	}

	public apiVersion(): string {
		return 'v0'
	}

	public listBackends(): Promise<string[]> {
		return this.api.queryBackends()
	}

	public async queryStringData(
		channel: DataUiChannel,
		start: string,
		end: string
	): Promise<DataUiDataSeries<number, string>> {
		const id = channelToId(channel)
		if (channel.dataType !== 'string') {
			throw new Error(`internal error: not a string channel: ${id}`)
		}
		const response = await this.api.queryData({
			channels: [{ name: channel.name, backend: channel.backend }],
			range: {
				startDate: start,
				endDate: end,
			},
			eventFields: [EventField.GLOBAL_MILLIS, EventField.VALUE],
		})
		let datapoints: DataUiDataPoint<number, string>[] = []
		for (const respItem of response) {
			if (respItem.channel.backend !== channel.backend) continue
			if (respItem.channel.name !== channel.name) continue
			datapoints = respItem.data.map(e => ({
				x: e[EventField.GLOBAL_MILLIS] as number,
				y: e[EventField.VALUE] as string,
			}))
			break
		}
		const result: DataUiDataSeries<number, string> = {
			name: id,
			datapoints,
		}
		return result
	}

	public async queryData(
		channel: DataUiChannel,
		start: string,
		end: string
	): Promise<DataUiDataSeries<number, DataUiAggregatedValue>> {
		const id = channelToId(channel)
		if (channel.dataType === 'string') {
			throw new Error(`internal error: string channel: ${id}`)
		}
		const response = await this.api.queryData({
			channels: [{ name: channel.name, backend: channel.backend }],
			range: {
				startDate: start,
				endDate: end,
			},
			eventFields: [
				EventField.GLOBAL_MILLIS,
				EventField.VALUE,
				EventField.EVENT_COUNT,
			],
			aggregation: {
				aggregations: [
					AggregationOperation.MIN,
					AggregationOperation.MEAN,
					AggregationOperation.MAX,
				],
				nrOfBins: NR_OF_BINS,
			},
		})
		let datapoints: DataUiDataPoint<number, DataUiAggregatedValue>[] = []
		for (const respItem of response) {
			if (respItem.channel.backend !== channel.backend) continue
			if (respItem.channel.name !== channel.name) continue
			datapoints = respItem.data.map(e => ({
				x: e[EventField.GLOBAL_MILLIS] as number,
				y: {
					count: e[EventField.EVENT_COUNT] as number,
					min: (e[EventField.VALUE] as AggregationResult).min as number,
					mean: (e[EventField.VALUE] as AggregationResult).mean as number,
					max: (e[EventField.VALUE] as AggregationResult).max as number,
				},
			}))
			break
		}
		const result = {
			name: id,
			datapoints,
		}
		return result
	}

	public async searchChannels(nameRegex?: string): Promise<DataUiChannel[]> {
		function extractDataShape(
			c: ChannelConfig
		): DataUiChannelShape | undefined {
			if (!Array.isArray(c.shape)) return undefined
			if (c.shape.length === 0) return undefined
			if (c.shape.length > 2) return undefined
			if (c.shape.length === 2) return 'image'
			if (c.shape[0] === 1) return 'scalar'
			return 'waveform'
		}
		function populateTags(c: DataUiChannel): void {
			const tags = [c.backend]
			if (c.dataType) tags.push(c.dataType)
			if (c.dataShape) tags.push(dataShapeDisplay[c.dataShape])
			c.tags = tags
		}
		const response = await this.api.queryChannelConfigs({ regex: nameRegex })
		const result = []
		for (const responseItem of response) {
			for (const x of responseItem.channels) {
				const ch: DataUiChannel = {
					name: x.name,
					backend: x.backend,
					description: x.description,
					dataShape: extractDataShape(x),
					dataType: x.type,
					unit: x.unit,
				}
				populateTags(ch)
				result.push(ch)
			}
		}
		return result
	}
}

export const queryRestApi = new ApiV0QueryProvider(
	window.DatabufferUi.QUERY_API
)
