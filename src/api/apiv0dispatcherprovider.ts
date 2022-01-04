import type { DataUiChannel, DataUiChannelState } from '../shared/channel'
import type { DataUiDispatcherApi } from './dispatcherapi'

export class ApiV0DispatcherProvider implements DataUiDispatcherApi {
	constructor(private url: string) {}

	apiVersion(): string {
		return 'v0'
	}

	async queryChannelState(channel: DataUiChannel): Promise<DataUiChannelState> {
		const response = await fetch(`${this.url}/channels/state`, {
			mode: 'cors',
			cache: 'no-cache',
			credentials: 'omit',
			headers: {
				'Content-Type': 'application/json',
			},
			redirect: 'follow',
			referrer: 'no-referrer',
			method: 'POST',
			body: JSON.stringify({
				channels: [
					{ name: channel.name, backend: channel.backend, queryLatest: true },
				],
			}),
		})
		const data = await response.json()
		if (data.length === 0) throw new Error('no result returned from dispatcher')
		if (data.length > 1)
			throw new Error(`multiple results returned from dispatcher`)
		const item = data[0]
		const result: DataUiChannelState = {
			connected: item.connected,
			recording: item.recording,
			latestEventDate: item.latestEventDate,
		}
		return result
	}
}
