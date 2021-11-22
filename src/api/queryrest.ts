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
	AggregationType,
	EventField,
} from '@paulscherrerinstitute/databuffer-query-js/api/v0/query-data'
import { ChannelConfig } from '@paulscherrerinstitute/databuffer-query-js/api/v0/query-channel-configs/response'
import {
	DataUiAggregatedValue,
	DataUiDataPoint,
	DataUiDataSeries,
} from '../shared/dataseries'
import { formatDate } from '../util'

export const NR_OF_BINS = 500
export type { DataResponse, ChannelNamesResponse }

/** the operations used on an Data API provider */
export interface DataApiProvider {
	apiVersion: () => string

	/** list the backends available through this API provider */
	listBackends: () => Promise<string[]>

	/** query for string data (cannot be aggregated) */
	queryStringData: (
		channel: DataUiChannel,
		start: string,
		end: string
	) => Promise<DataUiDataSeries<number, string>>

	/**
	 * query for the timestamps for all the events inside the bin.
	 * the promise resolves to an array of timestamps.
	 */
	queryEventTimestampsInBin: (
		channel: DataUiChannel,
		start: string,
		end: string
	) => Promise<number[]>

	/**
	 * query raw data of a waveform for one timestamp.
	 * the promise resolves to the array of Y values.
	 */
	queryWaveFormAtTimestamp: (
		channel: DataUiChannel,
		ts: number
	) => Promise<number[]>

	/** for a waveform, query the index-aggregated minimum/maximum values in the bin */
	queryIndexedMinMaxInBin: (
		channel: DataUiChannel,
		start: string,
		end: string
	) => Promise<{ min: number; max: number }[]>

	/** query for binned/aggregated data (count/min/mean/max) */
	queryBinnedData: (
		channel: DataUiChannel,
		start: string,
		end: string
	) => Promise<DataUiDataSeries<number, DataUiAggregatedValue>>

	/** search for channels available in the backend */
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

	public async queryEventTimestampsInBin(
		channel: DataUiChannel,
		start: string,
		end: string
	): Promise<number[]> {
		const response = await this.api.queryData({
			channels: [{ name: channel.name, backend: channel.backend }],
			range: {
				startDate: start,
				endDate: end,
			},
			eventFields: [EventField.GLOBAL_MILLIS],
		})
		let result: number[] = []
		for (const respItem of response) {
			if (respItem.channel.backend !== channel.backend) continue
			if (respItem.channel.name !== channel.name) continue
			result = respItem.data.map(e => e[EventField.GLOBAL_MILLIS] as number)
			break
		}
		return result
	}

	public async queryWaveFormAtTimestamp(
		channel: DataUiChannel,
		ts: number
	): Promise<number[]> {
		const start = new Date(ts).toISOString()
		const end = new Date(ts + 1).toISOString()
		const response = await this.api.queryData({
			channels: [{ name: channel.name, backend: channel.backend }],
			range: {
				startDate: start,
				endDate: end,
			},
			eventFields: [EventField.VALUE],
		})
		let result: number[] = []
		for (const respItem of response) {
			if (respItem.channel.backend !== channel.backend) continue
			if (respItem.channel.name !== channel.name) continue
			if (respItem.data.length > 1) {
				throw new Error(`response data length (${respItem.data.length}) > 1`)
			}
			result = respItem.data[0][EventField.VALUE] as number[]
			break
		}
		return result
	}

	public async queryIndexedMinMaxInBin(
		channel: DataUiChannel,
		start: string,
		end: string
	): Promise<{ min: number; max: number }[]> {
		const response = await this.api.queryData({
			channels: [{ name: channel.name, backend: channel.backend }],
			range: {
				startDate: start,
				endDate: end,
			},
			eventFields: [EventField.GLOBAL_MILLIS, EventField.VALUE],
			aggregation: {
				aggregationType: AggregationType.INDEX,
				aggregations: [AggregationOperation.MIN, AggregationOperation.MAX],
				nrOfBins: 1,
			},
		})
		let result: { min: number; max: number }[] = []
		for (const respItem of response) {
			if (respItem.channel.backend !== channel.backend) continue
			if (respItem.channel.name !== channel.name) continue
			result = (respItem.data[0].value as AggregationResult[]).map(e => ({
				min: e.min as number,
				max: e.max as number,
			}))
			break
		}
		return result
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

	public async queryBinnedData(
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
