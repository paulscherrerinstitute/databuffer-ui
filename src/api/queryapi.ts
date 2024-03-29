import type { DataUiChannel } from '../shared/channel'
import type {
	DataUiAggregatedValue,
	DataUiDataSeries,
	DataUiImage,
	DataUiScalarValue,
	DataUiWaveform,
	MinMax,
} from '../shared/dataseries'

export const NR_OF_BINS = 500

/** the operations used to query Data API */
export interface DataUiQueryApi {
	apiVersion: () => string

	/** list the backends available through this API provider */
	listBackends: () => Promise<string[]>

	/** query for scalar data without aggregation */
	queryRawScalarData: <T extends DataUiScalarValue>(
		channel: DataUiChannel,
		start: string,
		end: string,
		queryExpansion: boolean
	) => Promise<DataUiDataSeries<number, T>>

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
	) => Promise<DataUiWaveform>

	/** for a waveform, query the index-aggregated minimum/maximum values in the bin */
	queryIndexedMinMaxInBin: (
		channel: DataUiChannel,
		start: string,
		end: string
	) => Promise<MinMax[]>

	/**
	 * query for aggregated data (count/min/mean/max)
	 *
	 * @param nrOfBins set to `undefined` to disable time binning (but waveforms will
	 *                 still get binned along their index)
	 */
	queryAggregatedData: (
		channel: DataUiChannel,
		start: string,
		end: string,
		queryExpansion: boolean,
		nrOfBins?: number
	) => Promise<DataUiDataSeries<number, DataUiAggregatedValue>>

	/** search for channels available in the backend */
	searchChannels: (nameRegex?: string) => Promise<DataUiChannel[]>

	queryImageThumbnails: (
		channel: DataUiChannel,
		start: string,
		end: string
	) => Promise<DataUiDataSeries<number, DataUiImage>>

	queryImageAtTimestamp: (
		channel: DataUiChannel,
		ts: number
	) => Promise<DataUiImage>
}
