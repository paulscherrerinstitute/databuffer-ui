import type { Channel } from '@paulscherrerinstitute/databuffer-query-js/channel'
export type { Channel }
export {
	idToChannel,
	channelToId,
} from '@paulscherrerinstitute/databuffer-query-js/channel'

export function compareNameThenBackend<T extends Channel>(a: T, b: T): number {
	if (a.name < b.name) return -1
	if (a.name > b.name) return 1
	if (a.backend < b.backend) return -1
	if (a.backend > b.backend) return 1
	return 0
}
