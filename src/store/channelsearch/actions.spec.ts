import { describe, it } from 'mocha'
import { expect } from 'chai'

import { ChannelSearchActions, ChannelTypes } from './actions'

const EXAMPLE_ID = 'b1/ch1'
const EXAMPLE_PATTERN = '^sineg.*amplt$'

describe('ChannelSearchActions', () => {
	it('should create CHANNEL_SELECT', () => {
		const action = ChannelSearchActions.selectChannel(EXAMPLE_ID)
		const expected = {
			type: ChannelTypes.CHANNEL_SELECT,
			payload: {
				id: EXAMPLE_ID,
			},
		}
		expect(action).to.deep.equal(expected)
	})

	it('should create CHANNEL_SEARCH', () => {
		const action = ChannelSearchActions.searchChannel(EXAMPLE_PATTERN)
		const expected = {
			type: ChannelTypes.CHANNEL_SEARCH,
			payload: {
				pattern: EXAMPLE_PATTERN,
			},
		}
		expect(action).to.deep.equal(expected)
	})

	it('should create CHANNEL_SEARCH_REQUEST', () => {
		const action = ChannelSearchActions.searchChannelRequest(EXAMPLE_PATTERN)
		const expected = {
			type: ChannelTypes.CHANNEL_SEARCH_REQUEST,
			payload: {
				pattern: EXAMPLE_PATTERN,
			},
		}
		expect(action).to.deep.equal(expected)
	})

	it('should create CHANNEL_SEARCH_FAILURE', () => {
		const action = ChannelSearchActions.searchChannelFailure(
			new Error('example failure')
		)
		const expected = {
			type: ChannelTypes.CHANNEL_SEARCH_FAILURE,
			payload: {
				error: new Error('example failure'),
			},
		}
		expect(action.type).to.be.equal(expected.type)
		expect(action.payload.error).to.be.instanceOf(Error)
		expect(action.payload.error.message).to.be.equal(
			expected.payload.error.message
		)
	})

	it('should create CHANNEL_SEARCH_SUCCESS', () => {
		const ids = ['b1/ch1', 'b1/ch2']
		const entities = {
			'b1/ch1': {
				name: 'ch1',
				description: 'channel 1',
				backend: 'b1',
				source: 's1',
				type: 't1',
				shape: [1],
				unit: 'mA',
			},
			'b1/ch2': {
				name: 'ch2',
				backend: 'b1',
				source: 's2',
				type: 't2',
				shape: [1024, 512],
				unit: '',
			},
		}
		const action = ChannelSearchActions.searchChannelSuccess(ids, entities)
		const expected = {
			type: ChannelTypes.CHANNEL_SEARCH_SUCCESS,
			payload: {
				ids,
				entities,
			},
		}
		expect(action).to.deep.equal(expected)
	})
})
