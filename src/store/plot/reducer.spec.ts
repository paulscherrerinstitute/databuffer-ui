import { describe, it } from 'mocha'
import { expect } from 'chai'

import reducer, { initialState } from './reducer'
import { PlotActions } from './actions'

// some fixtures
const EXAMPLE_ERROR = new Error('example error')
const EXAMPLE_CHANNELS = [
	{ name: 'ch1', backend: 'b1' },
	{ name: 'ch2', backend: 'b2' },
	{ name: 'ch3', backend: 'b3' },
]
const EXAMPLE_IDS = ['b1/ch1', 'b2/ch2', 'b3/ch3']
const EXAMPLE_INDEX = 0
const EXAMPLE_ACTION_SELECT_CHANNEL = PlotActions.selectChannel(
	EXAMPLE_CHANNELS[0]
)
const EXAMPLE_ACTION_UNSELECT_CHANNEL = PlotActions.unselectChannel(
	EXAMPLE_INDEX
)
const EXAMPLE_ACTION_SET_SELECTED_CHANNELS = PlotActions.setSelectedChannels(
	EXAMPLE_CHANNELS
)

describe('plot reducer', () => {
	describe('initial state', () => {
		it('should have correct initial state', () => {
			expect(initialState).to.deep.equal({
				startTime: initialState.startTime, // will be checked separately below
				endTime: initialState.endTime, // will be checked separately below
				startPulse: 1,
				endPulse: 2,
				queryMode: 'time',
				channels: [],
				fetching: false,
				error: null,
				request: {
					sentAt: undefined,
					finishedAt: undefined,
				},
				response: [],
				yAxes: [],
				dataSeries: [],
			})
			expect(initialState.startTime).to.be.closeTo(Date.now() - 1000, 500)
			expect(initialState.endTime).to.be.closeTo(Date.now(), 500)
		})

		it('should return initial state at the beginning', () => {
			expect(reducer(undefined, {} as PlotActions)).to.equal(initialState)
		})
	})

	describe('on action of type SELECT_CHANNEL', () => {
		it('should add to channels', () => {
			const previousState = { ...initialState, channels: [] }
			const action = EXAMPLE_ACTION_SELECT_CHANNEL
			const nextState = reducer(previousState, action)
			expect(nextState).to.have.deep.own.property('channels', [
				EXAMPLE_CHANNELS[EXAMPLE_INDEX],
			])
		})
		it('should not add twice to channels', () => {
			const previousState = {
				...initialState,
				channels: [EXAMPLE_CHANNELS[EXAMPLE_INDEX]],
			}
			const action = EXAMPLE_ACTION_SELECT_CHANNEL
			const nextState = reducer(previousState, action)
			expect(nextState)
				.to.have.property('channels')
				.be.an('array')
				.of.length(1)
			expect(nextState).to.have.deep.own.property('channels', [
				EXAMPLE_CHANNELS[EXAMPLE_INDEX],
			])
		})
	})

	describe('on action of type UNSELECT_CHANNEL', () => {
		it('should remove from channels', () => {
			const previousState = {
				...initialState,
				channels: [EXAMPLE_CHANNELS[EXAMPLE_INDEX]],
			}
			const action = EXAMPLE_ACTION_UNSELECT_CHANNEL
			const nextState = reducer(previousState, action)
			expect(nextState).to.have.deep.own.property('channels', [])
		})

		it('should not break on empty selection', () => {
			const previousState = {
				...initialState,
				channels: [],
			}
			const action = EXAMPLE_ACTION_UNSELECT_CHANNEL
			const nextState = reducer(previousState, action)
			expect(nextState).to.have.deep.own.property('channels', [])
		})
	})
})
