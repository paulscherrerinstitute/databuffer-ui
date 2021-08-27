// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../ui/global.d.ts" />

import { QueryRest } from '@paulscherrerinstitute/databuffer-query-js/api/v0'
import type {
	DataResponse,
	ChannelNamesResponse,
} from '@paulscherrerinstitute/databuffer-query-js/api/v0'
import { DataUiChannel } from '../shared/channel'
import {
	AggregationOperation,
	EventField,
} from '@paulscherrerinstitute/databuffer-query-js/api/v0/query-data'

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
			channels: [channel],
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

	public searchChannels(nameRegex?: string) {
		return this.api.queryChannelConfigs({ regex: nameRegex })
	}
}

export const queryRestApi = new ApiV0QueryProvider(
	window.DatabufferUi.QUERY_API
)
