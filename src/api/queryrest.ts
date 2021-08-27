// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../ui/global.d.ts" />

import { QueryRest } from '@paulscherrerinstitute/databuffer-query-js/api/v0'
import type {
	DataResponse,
	ChannelNamesResponse,
} from '@paulscherrerinstitute/databuffer-query-js/api/v0'
import { DataUiChannel, DataUiChannelShape } from '../shared/channel'
import {
	AggregationOperation,
	EventField,
} from '@paulscherrerinstitute/databuffer-query-js/api/v0/query-data'
import { ChannelConfig } from '@paulscherrerinstitute/databuffer-query-js/api/v0/query-channel-configs/response'
import { dataShapeDisplay } from '../state/models/channelsearch'

export const NR_OF_BINS = 500
export type { DataResponse, ChannelNamesResponse }

export class ApiV0QueryProvider {
	private api: QueryRest

	constructor(private url: string) {
		this.api = new QueryRest(url)
	}

	public listBackends(): Promise<string[]> {
		return this.api.queryBackends()
	}

	public queryData(channel: DataUiChannel, start: string, end: string) {
		return this.api.queryData({
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
