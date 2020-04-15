import type { ChannelConfig } from '@psi/databuffer-query-js/query-channel-configs'
export type { ChannelConfig }

export interface ChannelWithTags extends ChannelConfig {
	tags: string[]
}

export enum ShapeName {
	SCALAR = 'scalar',
	WAVEFORM = '1d',
	IMAGE = '2d',
}

export const getShapeName = (c: ChannelConfig): ShapeName => {
	if (c.shape.length > 2)
		throw new Error(`shape has too many dimensions: ${JSON.stringify(c.shape)}`)
	if (c.shape.length === 0)
		throw new Error(`channel has no shape: ${c.backend}/${c.name}`)
	if (c.shape.length === 2) return ShapeName.IMAGE
	if (c.shape[0] === 1) return ShapeName.SCALAR
	return ShapeName.WAVEFORM
}

export const compareNameThenBackend = (
	a: ChannelConfig,
	b: ChannelConfig
): number => {
	if (a.name < b.name) return -1
	if (a.name > b.name) return 1
	if (a.backend < b.backend) return -1
	if (a.backend > b.backend) return 1
	return 0
}

export type IdToChannelMap = { [id: string]: ChannelConfig }
