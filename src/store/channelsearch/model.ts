import type { ChannelConfig } from '@psi/databuffer-query-js/query-channel-configs'
export type { ChannelConfig }

export interface ChannelWithTags extends ChannelConfig {
	tags: string[]
}

export type IdToChannelMap = { [id: string]: ChannelConfig }
