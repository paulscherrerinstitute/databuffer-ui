// import { Channel } from '@psi/databuffer-query-js/channel'

export interface Channel {
	backend: string
	name: string
	description?: string
}

export interface ChannelWithTags extends Channel {
	tags: string[]
}

// export {
//   QueryResponse,
// } from '@psi/databuffer-query-js/query-channel-names'

export type IdToChannelMap = { [id: string]: Channel }
