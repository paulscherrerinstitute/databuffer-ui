import { describe, it } from 'mocha'
import { expect } from 'chai'

import * as selectors from './selectors'

import { RootState } from '../reducer'
import { initialState } from './reducer'
import { PlotState } from '../plot/reducer'
import { RoutingState } from '../routing/reducer'
import { ShapeName } from './model'

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
			'backend2/channel2': {
				name: 'channel2',
				backend: 'backend2',
				description: 'a',
				source: 'tcp://localhost:1001',
				unit: 'A',
				shape: [1],
				type: 'uint16',
			},
			'backend2/channel3': {
				name: 'channel3',
				backend: 'backend2',
				description: 'b',
				source: 'tcp://localhost:1002',
				unit: 'B',
				shape: [1],
				type: 'float32',
			},
			'backend2/channel1': {
				name: 'channel1',
				backend: 'backend2',
				description: 'c',
				source: 'tcp://localhost:1003',
				unit: 'C',
				shape: [10],
				type: 'uint16',
			},
			'backend1/channel2': {
				name: 'channel2',
				backend: 'backend1',
				description: 'd',
				source: 'tcp://localhost:1004',
				unit: 'D',
				shape: [20],
				type: 'float32',
			},
			'backend3/channel1': {
				name: 'channel1',
				backend: 'backend3',
				description: 'e',
				source: 'tcp://localhost:1005',
				unit: 'E',
				shape: [10, 20],
				type: 'uint16',
			},
			'backend1/channel1': {
				name: 'channel1',
				backend: 'backend1',
				description: 'f',
				source: 'tcp://localhost:1006',
				unit: 'F',
				shape: [20, 10],
				type: 'uint16',
			},
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
		expect(
			selectors.results(state1).map(x => ({ name: x.name, backend: x.backend }))
		).to.deep.equal([
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
		const val = selectors
			.resultsWithTags(state1)
			.map(x => ({ name: x.name, backend: x.backend, tags: x.tags }))
		expect(val).to.deep.equal([
			{
				name: 'channel1',
				backend: 'backend1',
				tags: ['backend1', ShapeName.IMAGE],
			},
			{
				name: 'channel1',
				backend: 'backend2',
				tags: ['backend2', ShapeName.WAVEFORM],
			},
			{
				name: 'channel1',
				backend: 'backend3',
				tags: ['backend3', ShapeName.IMAGE],
			},
			{
				name: 'channel2',
				backend: 'backend1',
				tags: ['backend1', ShapeName.WAVEFORM],
			},
			{
				name: 'channel2',
				backend: 'backend2',
				tags: ['backend2', ShapeName.SCALAR],
			},
			{
				name: 'channel3',
				backend: 'backend2',
				tags: ['backend2', ShapeName.SCALAR],
			},
		])
	})

	it('availableTags are complete', () => {
		const state1 = EXAMPLE_STATE_WITH_ENTITIES
		const val = selectors.availableTags(state1)
		expect(val)
			.to.be.an('array')
			.that.includes.members([
				'backend1',
				'backend2',
				'backend3',
				ShapeName.SCALAR,
				ShapeName.WAVEFORM,
				ShapeName.IMAGE,
			])
	})

	it('availableTags are sorted', () => {
		const state1 = EXAMPLE_STATE_WITH_ENTITIES
		const val = selectors.availableTags(state1)
		expect(val).to.deep.equal(
			[
				ShapeName.SCALAR,
				ShapeName.WAVEFORM,
				ShapeName.IMAGE,
				'backend1',
				'backend2',
				'backend3',
			].sort()
		)
	})

	it('retrieves available backends', () => {
		const state1 = {
			...BASE_STATE,
			channelSearch: { ...BASE_STATE.channelSearch, availableBackends: [] },
		}
		const state2 = {
			...BASE_STATE,
			channelSearch: {
				...BASE_STATE.channelSearch,
				availableBackends: ['a', 'b', 'c'],
			},
		}
		expect(selectors.availableBackends(state1)).to.deep.equal([])
		expect(selectors.availableBackends(state2)).to.deep.equal(['a', 'b', 'c'])
	})

	it('retrieves selected backends', () => {
		const state1 = {
			...BASE_STATE,
			channelSearch: { ...BASE_STATE.channelSearch, selectedBackends: [] },
		}
		const state2 = {
			...BASE_STATE,
			channelSearch: {
				...BASE_STATE.channelSearch,
				selectedBackends: ['a', 'b', 'c'],
			},
		}
		expect(selectors.selectedBackends(state1)).to.deep.equal([])
		expect(selectors.selectedBackends(state2)).to.deep.equal(['a', 'b', 'c'])
	})
})
