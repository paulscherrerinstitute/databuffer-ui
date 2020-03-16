import { describe, it } from 'mocha'
import { expect } from 'chai'

import * as selectors from './selectors'

import { RootState } from '../reducer'
import { initialState } from './reducer'
import { PlotState } from '../plot/reducer'
import { RoutingState } from '../routing/reducer'

const BASE_STATE: RootState = {
	channelSearch: initialState,
	plot: {} as PlotState,
	route: {} as RoutingState,
}

const EXAMPLE_STATE_WITH_ENTITIES = {
	...BASE_STATE,
	channelSearch: {
		...BASE_STATE.channelSearch,
		entities: {
			'backend2/channel2': { name: 'channel2', backend: 'backend2' },
			'backend2/channel3': { name: 'channel3', backend: 'backend2' },
			'backend2/channel1': { name: 'channel1', backend: 'backend2' },
			'backend1/channel2': { name: 'channel2', backend: 'backend1' },
			'backend3/channel1': { name: 'channel1', backend: 'backend3' },
			'backend1/channel1': { name: 'channel1', backend: 'backend1' },
		},
	},
}

describe('channelsearch selectors', () => {
	it('retrieves error', () => {
		const state1 = {
			...BASE_STATE,
			channelSearch: { ...BASE_STATE.channelSearch, error: null },
		}
		const state2 = {
			...BASE_STATE,
			channelSearch: {
				...BASE_STATE.channelSearch,
				error: new Error('example error'),
			},
		}
		expect(selectors.error(state1)).to.be.null
		expect(selectors.error(state2)).to.be.instanceOf(Error)
		expect(selectors.error(state2).message).to.equal('example error')
	})

	it('retrieves fetching', () => {
		const state1 = {
			...BASE_STATE,
			channelSearch: { ...BASE_STATE.channelSearch, fetching: true },
		}
		const state2 = {
			...BASE_STATE,
			channelSearch: { ...BASE_STATE.channelSearch, fetching: false },
		}
		expect(selectors.fetching(state1)).to.be.true
		expect(selectors.fetching(state2)).to.be.false
	})

	it('retrieves pattern', () => {
		const state1 = {
			...BASE_STATE,
			channelSearch: { ...BASE_STATE.channelSearch, pattern: '' },
		}
		const state2 = {
			...BASE_STATE,
			channelSearch: { ...BASE_STATE.channelSearch, pattern: 'xyz' },
		}
		expect(selectors.pattern(state1)).to.deep.equal('')
		expect(selectors.pattern(state2)).to.deep.equal('xyz')
	})

	it('results are sorted by name, then backend', () => {
		const state1 = EXAMPLE_STATE_WITH_ENTITIES
		expect(selectors.results(state1)).to.deep.equal([
			{ name: 'channel1', backend: 'backend1' },
			{ name: 'channel1', backend: 'backend2' },
			{ name: 'channel1', backend: 'backend3' },
			{ name: 'channel2', backend: 'backend1' },
			{ name: 'channel2', backend: 'backend2' },
			{ name: 'channel3', backend: 'backend2' },
		])
	})

	it('resultsWithTags include the backend as a tag', () => {
		const state1 = EXAMPLE_STATE_WITH_ENTITIES
		const val = selectors.resultsWithTags(state1)
		expect(val).to.deep.equal([
			{ name: 'channel1', backend: 'backend1', tags: ['backend1'] },
			{ name: 'channel1', backend: 'backend2', tags: ['backend2'] },
			{ name: 'channel1', backend: 'backend3', tags: ['backend3'] },
			{ name: 'channel2', backend: 'backend1', tags: ['backend1'] },
			{ name: 'channel2', backend: 'backend2', tags: ['backend2'] },
			{ name: 'channel3', backend: 'backend2', tags: ['backend2'] },
		])
	})

	it('availableTags are complete', () => {
		const state1 = EXAMPLE_STATE_WITH_ENTITIES
		const val = selectors.availableTags(state1)
		expect(val)
			.to.be.an('array')
			.that.includes.members(['backend1', 'backend2', 'backend3'])
	})

	it('availableTags are sorted', () => {
		const state1 = EXAMPLE_STATE_WITH_ENTITIES
		const val = selectors.availableTags(state1)
		expect(val).to.deep.equal(['backend1', 'backend2', 'backend3'])
	})
})
