import { QueryRest } from '@paulscherrerinstitute/databuffer-query-js/api/v0'
import { ChannelConfig } from '@paulscherrerinstitute/databuffer-query-js/api/v0/query-channel-configs'
import {
	AggregationOperation,
	AggregationResult,
	AggregationType,
	EventField,
} from '@paulscherrerinstitute/databuffer-query-js/api/v0/query-data'

import { channelToId, dataShapeDisplay } from '../shared/channel'
import type { DataUiChannel, DataUiChannelShape } from '../shared/channel'
import type {
	DataUiAggregatedValue,
	DataUiDataPoint,
	DataUiDataSeries,
	DataUiScalarValue,
} from '../shared/dataseries'
import { NR_OF_BINS } from './queryapi'
import type { DataUiQueryApi } from './queryapi'

export class ApiV0QueryProvider implements DataUiQueryApi {
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

	public async queryRawScalarData<T extends DataUiScalarValue>(
		channel: DataUiChannel,
		start: string,
		end: string,
		queryExpansion: boolean = false
	): Promise<DataUiDataSeries<number, T>> {
		const id = channelToId(channel)
		if (channel.dataShape !== 'scalar') {
			throw new Error(`internal error: not a scalar channel: ${id}`)
		}
		const response = await this.api.queryData({
			channels: [{ name: channel.name, backend: channel.backend }],
			range: {
				startDate: start,
				endDate: end,
				startExpansion: queryExpansion,
				endExpansion: queryExpansion,
			},
			eventFields: [EventField.GLOBAL_MILLIS, EventField.VALUE],
		})
		let datapoints: DataUiDataPoint<number, T>[] = []
		for (const respItem of response) {
			if (respItem.channel.backend !== channel.backend) continue
			if (respItem.channel.name !== channel.name) continue
			datapoints = respItem.data.map(e => ({
				x: e[EventField.GLOBAL_MILLIS] as number,
				y: e[EventField.VALUE] as T,
			}))
			break
		}
		const result: DataUiDataSeries<number, T> = {
			name: id,
			datapoints,
		}
		return result
	}

	public async queryBoolData(
		channel: DataUiChannel,
		start: string,
		end: string,
		queryExpansion: boolean = false
	): Promise<DataUiDataSeries<number, boolean>> {
		const id = channelToId(channel)
		if (channel.dataType !== 'bool') {
			throw new Error(`internal error: not a bool channel: ${id}`)
		}
		const response = await this.api.queryData({
			channels: [{ name: channel.name, backend: channel.backend }],
			range: {
				startDate: start,
				endDate: end,
				startExpansion: queryExpansion,
				endExpansion: queryExpansion,
			},
			eventFields: [EventField.GLOBAL_MILLIS, EventField.VALUE],
		})
		let datapoints: DataUiDataPoint<number, boolean>[] = []
		for (const respItem of response) {
			if (respItem.channel.backend !== channel.backend) continue
			if (respItem.channel.name !== channel.name) continue
			datapoints = respItem.data.map(e => ({
				x: e[EventField.GLOBAL_MILLIS] as number,
				y: e[EventField.VALUE] as boolean,
			}))
			break
		}
		const result: DataUiDataSeries<number, boolean> = {
			name: id,
			datapoints,
		}
		return result
	}

	public async queryRawData(
		channel: DataUiChannel,
		start: string,
		end: string,
		queryExpansion: boolean = false
	): Promise<DataUiDataSeries<number, number>> {
		const id = channelToId(channel)
		if (channel.dataType === 'string') {
			throw new Error(`internal error: not a numeric channel: ${id}`)
		}
		const response = await this.api.queryData({
			channels: [{ name: channel.name, backend: channel.backend }],
			range: {
				startDate: start,
				endDate: end,
				startExpansion: queryExpansion,
				endExpansion: queryExpansion,
			},
			eventFields: [EventField.GLOBAL_MILLIS, EventField.VALUE],
		})
		let datapoints: DataUiDataPoint<number, number>[] = []
		for (const respItem of response) {
			if (respItem.channel.backend !== channel.backend) continue
			if (respItem.channel.name !== channel.name) continue
			datapoints = respItem.data.map(e => ({
				x: e[EventField.GLOBAL_MILLIS] as number,
				y: e[EventField.VALUE] as number,
			}))
			break
		}
		const result: DataUiDataSeries<number, number> = {
			name: id,
			datapoints,
		}
		return result
	}

	public async queryAggregatedData(
		channel: DataUiChannel,
		start: string,
		end: string,
		queryExpansion: boolean,
		nrOfBins?: number
	): Promise<DataUiDataSeries<number, DataUiAggregatedValue>> {
		const id = channelToId(channel)
		if (channel.dataType === 'string') {
			throw new Error(
				`internal error: string channel cannot be aggregated: ${id}`
			)
		}
		const response = await this.api.queryData({
			channels: [{ name: channel.name, backend: channel.backend }],
			range: {
				startDate: start,
				endDate: end,
				startExpansion: queryExpansion,
				endExpansion: queryExpansion,
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
				nrOfBins,
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
