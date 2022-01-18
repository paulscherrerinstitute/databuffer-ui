export type DataUiChannelShape = 'scalar' | 'waveform' | 'image'

export interface DataUiChannelState {
	recording: boolean
	connected: boolean
	latestEventDate: string
}

export interface DataUiChannel {
	name: string
	backend: string
	description?: string
	dataType?: string
	dataShape?: DataUiChannelShape
	source?: string
	tags?: string[]
	unit?: string
	channelState?: DataUiChannelState
}

export const BACKEND_SEPARATOR = '/'

export function channelToId(ch: DataUiChannel): string {
	return `${ch.backend}${BACKEND_SEPARATOR}${ch.name}`
}

export function idToChannel(id: string): DataUiChannel {
	const parts = id.split(BACKEND_SEPARATOR)
	if (parts.length !== 2) {
		throw new Error(`channel id invalid: ${id}`)
	}
	const [backend, name] = parts
	return { name, backend }
}

export function compareNameThenBackend<T extends DataUiChannel>(
	a: T,
	b: T
): number {
	if (a.name < b.name) return -1
	if (a.name > b.name) return 1
	if (a.backend < b.backend) return -1
	if (a.backend > b.backend) return 1
	return 0
}

export const dataShapeDisplay = {
	scalar: 'scalar',
	waveform: '1d',
	image: '2d',
}
