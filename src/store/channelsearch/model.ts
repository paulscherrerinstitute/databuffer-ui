// import { Channel } from '@psi/databuffer-queryrest/channel'

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
// } from '@psi/databuffer-queryrest/query-channel-names'

export type IdToChannelMap = { [id: string]: Channel }
