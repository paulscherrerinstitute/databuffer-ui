import type { DataUiChannel, DataUiChannelState } from '../shared/channel'

/** the operations used to query a dispatcher */
export interface DataUiDispatcherApi {
	apiVersion: () => string

	queryChannelState: (channel: DataUiChannel) => Promise<DataUiChannelState>
}
