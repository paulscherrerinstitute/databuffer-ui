import { describe, it } from 'mocha'
import { expect } from 'chai'

import reducer, { initialState } from './reducer'
import { ChannelSearchActions } from './actions'

// some fixtures
const EXAMPLE_ERROR = new Error('example error')
const EXAMPLE_CHANNELS = {
	'b1/ch1': { name: 'ch1', backend: 'b1' },
	'b2/ch2': { name: 'ch2', backend: 'b2' },
}
const EXAMPLE_IDS = Object.keys(EXAMPLE_CHANNELS).sort()
const EXAMPLE_PATTERN = 'abc'
const EXAMPLE_ACTION_CHANNEL_SEARCH = ChannelSearchActions.searchChannel(
	EXAMPLE_PATTERN
)
const EXAMPLE_ACTION_CHANNEL_SEARCH_REQUEST = ChannelSearchActions.searchChannelRequest(
	'abc'
)
const EXAMPLE_ACTION_CHANNEL_SEARCH_FAILURE = ChannelSearchActions.searchChannelFailure(
	EXAMPLE_ERROR
)
const EXAMPLE_ACTION_CHANNEL_SEARCH_SUCCESS = ChannelSearchActions.searchChannelSuccess(
	EXAMPLE_IDS,
	EXAMPLE_CHANNELS
)

describe('channelsearch reducer', () => {
	describe('initial state', () => {
		it('should have correct initial state', () => {
			expect(initialState).to.deep.equal({
				pattern: '',
				availableBackends: [],
				selectedBackends: [],
				ids: [],
				entities: {},
				error: null,
				fetching: false,
			})
		})

		it('should return initial state at the beginning', () => {
			expect(reducer(undefined, {} as ChannelSearchActions)).to.deep.equal(
				initialState
			)
		})
	})

	describe('on action of type CHANNEL_SEARCH', () => {
		it('should set pattern', () => {
			const previousState = {
				...initialState,
				pattern: '',
			}
			const action = EXAMPLE_ACTION_CHANNEL_SEARCH
			const nextState = reducer(previousState, action)
			expect(nextState).to.have.own.property('pattern', EXAMPLE_PATTERN)
		})
	})

	describe('on action of type CHANNEL_SEARCH_REQUEST', () => {
		it('should set fetching', () => {
			const previousState = {
				...initialState,
				fetching: false,
			}
			const action = EXAMPLE_ACTION_CHANNEL_SEARCH_REQUEST
			const nextState = reducer(previousState, action)
			expect(nextState).to.deep.include({ fetching: true })
		})

		it('should re-set error', () => {
			const previousState = {
				...initialState,
				error: EXAMPLE_ERROR,
			}
			const action = EXAMPLE_ACTION_CHANNEL_SEARCH_REQUEST
			const nextState = reducer(previousState, action)
			expect(nextState).to.deep.include({ error: null })
		})

		it('should re-set entities', () => {
			const previousState = {
				...initialState,
				entities: EXAMPLE_CHANNELS,
			}
			const action = EXAMPLE_ACTION_CHANNEL_SEARCH_REQUEST
			const nextState = reducer(previousState, action)
			expect(nextState).to.deep.include({ entities: {} })
		})

		it('should re-set ids', () => {
			const previousState = {
				...initialState,
				ids: EXAMPLE_IDS,
			}
			const action = EXAMPLE_ACTION_CHANNEL_SEARCH_REQUEST
			const nextState = reducer(previousState, action)
			expect(nextState).to.deep.include({ ids: [] })
		})
	})

	describe('on action of type CHANNEL_SEARCH_FAILURE', () => {
		it('should set error', () => {
			const previousState = initialState
			const action = EXAMPLE_ACTION_CHANNEL_SEARCH_FAILURE
			const nextState = reducer(previousState, action)
			expect(nextState).to.have.own.property('error', EXAMPLE_ERROR)
		})

		it('should re-set fetching', () => {
			const previousState = { ...initialState, fetching: true }
			const action = EXAMPLE_ACTION_CHANNEL_SEARCH_FAILURE
			const nextState = reducer(previousState, action)
			expect(nextState).to.have.own.property('fetching', false)
		})
	})

	describe('on action of type CHANNEL_SEARCH_SUCCESS', () => {
		it('should re-set fetching', () => {
			const previousState = { ...initialState, fetching: true }
			const action = EXAMPLE_ACTION_CHANNEL_SEARCH_SUCCESS
			const nextState = reducer(previousState, action)
			expect(nextState).to.have.own.property('fetching', false)
		})

		it('should set ids', () => {
			const previousState = { ...initialState, fetching: true }
			const action = EXAMPLE_ACTION_CHANNEL_SEARCH_SUCCESS
			const nextState = reducer(previousState, action)
			expect(nextState).to.have.own.property('ids', EXAMPLE_IDS)
		})

		it('should set entities', () => {
			const previousState = { ...initialState, fetching: true }
			const action = EXAMPLE_ACTION_CHANNEL_SEARCH_SUCCESS
			const nextState = reducer(previousState, action)
			expect(nextState).to.have.own.property('entities', EXAMPLE_CHANNELS)
		})
	})
})
