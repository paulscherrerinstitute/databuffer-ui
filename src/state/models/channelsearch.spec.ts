/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable mocha/no-skipped-tests */
import { describe, it, xit } from 'mocha'
import { expect } from 'chai'
import sinon from 'sinon'

import {
	channelsearch,
	channelsearchSelectors,
	ShapeName,
	IdToChannelMap,
} from './channelsearch'
import { store, AppDispatch, AppState } from '../store'
import { createTestEnv, RdxTestEnv } from '../rdx-test-util'
import { EffectFns, RoutingState } from '@captaincodeman/rdx'
import { ROUTE } from '../routing'
import { be } from 'date-fns/locale'

describe('channelsearch model', () => {
	describe('initial state', () => {
		it('availableBackends === []', () => {
			expect(channelsearch.state.availableBackends)
				.to.be.an('array')
				.of.length(0)
		})
		it('availableBackendsFetching === false', () => {
			expect(channelsearch.state.availableBackendsFetching).to.be.false
		})
		it('availableBackendsError === undefined', () => {
			expect(channelsearch.state.availableBackendsError).to.be.undefined
		})
		it('selectedBackends = []', () => {
			expect(channelsearch.state.selectedBackends)
				.to.be.an('array')
				.of.length(0)
		})
		it('entities', () => {
			expect(channelsearch.state.entities).to.be.an('object').that.is.empty
		})
		it('ids === []', () => {
			expect(channelsearch.state.ids).to.be.an('array').of.length(0)
		})
		it('fetching === false', () => {
			expect(channelsearch.state.fetching).to.be.false
		})
		it('error  === undefined', () => {
			expect(channelsearch.state.error).to.be.undefined
		})
	})

	describe('reducers', () => {
		describe('patternChange', () => {
			it('sets pattern', () => {
				const newState = channelsearch.reducers.patternChange(
					channelsearch.state,
					'foobar'
				)
				expect(newState.pattern).to.equal('foobar')
			})
		})

		describe('availableBackendsRequest', () => {
			it('sets availableBackendsFetching = true', () => {
				const newState = channelsearch.reducers.availableBackendsRequest(
					channelsearch.state
				)
				expect(newState.availableBackendsFetching).to.be.true
			})
			it('sets availableBackends = []', () => {
				const newState = channelsearch.reducers.availableBackendsRequest(
					channelsearch.state
				)
				expect(newState.availableBackends).to.be.an('array').of.length(0)
			})
			it('sets availableBackendsError = undefined', () => {
				const newState = channelsearch.reducers.availableBackendsRequest(
					channelsearch.state
				)
				expect(newState.availableBackendsError).to.be.undefined
			})
		})

		describe('availableBackendsSuccess', () => {
			let backends: string[]

			beforeEach(() => {
				backends = ['b1', 'b2']
			})
			it('sets availableBackendsFetching = false', () => {
				const newState = channelsearch.reducers.availableBackendsSuccess(
					channelsearch.state,
					backends
				)
				expect(newState.availableBackendsFetching).to.be.false
			})
			it('sets availableBackends', () => {
				const newState = channelsearch.reducers.availableBackendsSuccess(
					channelsearch.state,
					backends
				)
				expect(newState.availableBackends).to.deep.equal(backends)
			})
		})

		describe('availableBackendsError', () => {
			let error: Error

			beforeEach(() => {
				error = new Error('oops')
			})

			it('sets fetching = false', () => {
				const newState = channelsearch.reducers.availableBackendsError(
					channelsearch.state,
					error
				)
				expect(newState.fetching).to.be.false
			})
			it('sets error', () => {
				const newState = channelsearch.reducers.availableBackendsError(
					channelsearch.state,
					error
				)
				expect(newState.availableBackendsError)
					.to.be.an('Error')
					.that.deep.equals(error)
			})
		})

		describe('searchRequest', () => {
			it('sets fetching = true', () => {
				const newState = channelsearch.reducers.searchRequest(
					channelsearch.state
				)
				expect(newState.fetching).to.be.true
			})
			it('sets entities = {}', () => {
				const newState = channelsearch.reducers.searchRequest(
					channelsearch.state
				)
				expect(newState.entities).to.be.an('object').that.is.empty
			})
			it('sets ids = []', () => {
				const newState = channelsearch.reducers.searchRequest(
					channelsearch.state
				)
				expect(newState.ids).to.be.an('array').of.length(0)
			})
			it('sets error = undefined', () => {
				const newState = channelsearch.reducers.searchRequest(
					channelsearch.state
				)
				expect(newState.error).to.be.undefined
			})
		})

		describe('searchSuccess', () => {
			let entities: IdToChannelMap

			beforeEach(() => {
				entities = {
					'b1/c1': {
						backend: 'b1',
						name: 'c1',
						source: 's1',
						type: 't1',
						shape: [1],
					},
					'b2/c2': {
						backend: 'b2',
						name: 'c2',
						source: 's2',
						type: 't2',
						shape: [1],
					},
					'b3/c3': {
						backend: 'b3',
						name: 'c3',
						source: 's3',
						type: 't3',
						shape: [1],
					},
					'b4/c4': {
						backend: 'b4',
						name: 'c4',
						source: 's4',
						type: 't4',
						shape: [1],
					},
				}
			})

			it('sets fetching = false', () => {
				const newState = channelsearch.reducers.searchSuccess(
					channelsearch.state,
					entities
				)
				expect(newState.fetching).to.be.false
			})
			it('sets entities', () => {
				const newState = channelsearch.reducers.searchSuccess(
					channelsearch.state,
					entities
				)
				expect(newState.entities).to.deep.equal(entities)
			})
			it('sets ids', () => {
				const newState = channelsearch.reducers.searchSuccess(
					channelsearch.state,
					entities
				)
				expect(newState.ids).to.deep.equal(['b1/c1', 'b2/c2', 'b3/c3', 'b4/c4'])
			})
		})

		describe('searchFailure', () => {
			let error: Error

			beforeEach(() => {
				error = new Error('oops')
			})

			it('sets fetching = false', () => {
				const newState = channelsearch.reducers.searchFailure(
					channelsearch.state,
					error
				)
				expect(newState.fetching).to.be.false
			})
			it('sets error', () => {
				const newState = channelsearch.reducers.searchFailure(
					channelsearch.state,
					error
				)
				expect(newState.error).to.be.an('Error').that.deep.equals(error)
			})
		})
	})

	describe('effects', () => {
		let rdxTest: RdxTestEnv<AppState, AppDispatch>
		let effects: EffectFns

		beforeEach(() => {
			rdxTest = createTestEnv(store)
			// need to fake dispatching actions for routing, because jsdom
			// messes things up and tests will fail
			// ---
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			rdxTest.dispatch.routing.replace = sinon.fake()
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore: routing plugin is not added to dispatch somehow.
			rdxTest.dispatch.routing.push = sinon.fake()
			effects = rdxTest.modelEffects(channelsearch)
		})

		afterEach(() => {
			sinon.restore()
			rdxTest.cleanup()
		})

		describe('init', () => {
			it('dispatches availableBackendsRequest', async () => {
				const fake = sinon.fake()
				rdxTest.dispatch.channelsearch.availableBackendsRequest = fake
				await effects.init()
				expect(fake.callCount).to.equal(1)
			})
			xit('dispatches availableBackendsSuccess on success', async () => {
				// TODO: implement
			})
			xit('dispatches availableBackendsError on failure', async () => {
				// TODO: implement
			})
		})

		describe('runSearch', () => {
			it('dispatches searchRequest', async () => {
				const fake = sinon.fake()
				rdxTest.dispatch.channelsearch.searchRequest = fake
				await effects.runSearch()
				expect(fake.callCount).to.equal(1)
			})

			xit('dispatches searchSuccess on successful search', async () => {
				const fake = sinon.fake()
				rdxTest.dispatch.channelsearch.searchSuccess = fake
				await effects.runSearch()
				expect(fake.callCount).to.equal(1)
			})

			xit('dispatches searchFailure on error', async () => {
				const fake = sinon.fake()
				rdxTest.dispatch.channelsearch.searchFailure = fake
				await effects.runSearch()
				expect(fake.callCount).to.equal(1)
				console.log(fake.args)
			})

			it('does not change view to channel-search if that is the current view', async () => {
				const fake = sinon.fake()
				rdxTest.dispatch.routing.push = fake
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				rdxTest.state.routing.page = ROUTE.CHANNEL_SEARCH
				await effects.runSearch()
				expect(fake.callCount).to.equal(0)
			})

			it('changes view to channel-search if that is not the current view', async () => {
				const fake = sinon.fake()
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				rdxTest.dispatch.routing.push = fake
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				rdxTest.state.routing.page = 'some-other-view'
				await effects.runSearch()
				expect(fake.callCount).to.equal(1)
				expect(fake.args[0][0]).to.equal('/search')
			})
		})

		describe('routing/change', () => {
			describe('route channel-search', () => {
				it('sets the search pattern', async () => {
					const fake = sinon.fake()
					rdxTest.dispatch.channelsearch.patternChange = fake
					const payload: RoutingState<ROUTE> = {
						page: ROUTE.CHANNEL_SEARCH,
						params: {},
						queries: { q: 'foo' },
					}
					await effects['routing/change'](payload)
					expect(fake.callCount).to.equal(1)
					expect(fake.args[0][0]).to.equal('foo')
				})

				it('triggers the search', async () => {
					const fake = sinon.fake()
					rdxTest.dispatch.channelsearch.runSearch = fake
					const payload: RoutingState<ROUTE> = {
						page: ROUTE.CHANNEL_SEARCH,
						params: {},
						queries: { q: 'foo' },
					}
					await effects['routing/change'](payload)
					expect(fake.callCount).to.equal(1)
				})
			})
		})
	})

	describe('selectors', () => {
		let state: AppState
		beforeEach(() => {
			state = { ...store.state }
		})

		it('retrieves error', () => {
			const state1 = {
				...state,
				channelsearch: { ...state.channelsearch, error: undefined },
			}
			expect(channelsearchSelectors.error(state1)).to.be.undefined
			const state2 = {
				...state,
				channelsearch: {
					...state.channelsearch,
					error: new Error('example error'),
				},
			}
			const err = channelsearchSelectors.error(state2)!
			expect(err).to.be.instanceOf(Error)
			expect(err.message).to.equal('example error')
		})

		it('retrieves fetching', () => {
			const state1 = {
				...state,
				channelsearch: { ...state.channelsearch, fetching: true },
			}
			expect(channelsearchSelectors.fetching(state1)).to.be.true
			const state2 = {
				...state,
				channelsearch: { ...state.channelsearch, fetching: false },
			}
			expect(channelsearchSelectors.fetching(state2)).to.be.false
		})

		it('retrieves pattern', () => {
			const state1 = {
				...state,
				channelsearch: { ...state.channelsearch, pattern: '' },
			}
			expect(channelsearchSelectors.pattern(state1)).to.deep.equal('')
			const state2 = {
				...state,
				channelsearch: { ...state.channelsearch, pattern: 'xyz' },
			}
			expect(channelsearchSelectors.pattern(state2)).to.deep.equal('xyz')
		})

		it('sorts results by name, then backend', () => {
			const state1 = {
				...state,
				channelsearch: {
					...state.channelsearch,
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
			expect(
				channelsearchSelectors
					.results(state1)
					.map(x => ({ name: x.name, backend: x.backend }))
			).to.deep.equal([
				{ name: 'channel1', backend: 'backend1' },
				{ name: 'channel1', backend: 'backend2' },
				{ name: 'channel1', backend: 'backend3' },
				{ name: 'channel2', backend: 'backend1' },
				{ name: 'channel2', backend: 'backend2' },
				{ name: 'channel3', backend: 'backend2' },
			])
		})

		it('includes backend as tag', () => {
			const state1 = {
				...state,
				channelsearch: {
					...state.channelsearch,
					entities: {
						'backend1/channel1': {
							name: 'channel1',
							backend: 'backend1',
							description: 'a',
							source: 'tcp://localhost:1001',
							unit: 'A',
							shape: [1],
							type: 'uint16',
						},
						'backend2/channel2': {
							name: 'channel2',
							backend: 'backend2',
							description: 'b',
							source: 'tcp://localhost:1002',
							unit: 'B',
							shape: [1],
							type: 'float32',
						},
					},
				},
			}
			const val = channelsearchSelectors
				.resultsWithTags(state1)
				.map(x => ({ name: x.name, backend: x.backend, tags: x.tags }))
			expect(val).to.be.an('array').of.length(2)
			expect(val[0].tags).to.include('backend1')
			expect(val[1].tags).to.include('backend2')
		})

		it('includes shape name as tag', () => {
			const state1 = {
				...state,
				channelsearch: {
					...state.channelsearch,
					entities: {
						'backend1/channel1': {
							name: 'channel1',
							backend: 'backend1',
							description: 'a',
							source: 'tcp://localhost:1001',
							unit: 'A',
							shape: [1],
							type: 'uint16',
						},
						'backend1/channel2': {
							name: 'channel2',
							backend: 'backend1',
							description: 'b',
							source: 'tcp://localhost:1002',
							unit: 'B',
							shape: [10],
							type: 'float32',
						},
						'backend1/channel3': {
							name: 'channel3',
							backend: 'backend1',
							description: 'c',
							source: 'tcp://localhost:1003',
							unit: 'C',
							shape: [10, 20],
							type: 'uint16',
						},
					},
				},
			}
			const val = channelsearchSelectors
				.resultsWithTags(state1)
				.map(x => ({ name: x.name, backend: x.backend, tags: x.tags }))
			expect(val).to.be.an('array').of.length(3)
			expect(val[0].tags).to.include(ShapeName.SCALAR)
			expect(val[1].tags).to.include(ShapeName.WAVEFORM)
			expect(val[2].tags).to.include(ShapeName.IMAGE)
		})

		it('combines all tags into availableTags', () => {
			const state1 = {
				...state,
				channelsearch: {
					...state.channelsearch,
					entities: {
						'backend1/channel1': {
							name: 'channel1',
							backend: 'backend1',
							description: 'a',
							source: 'tcp://localhost:1001',
							unit: 'A',
							shape: [1],
							type: 'uint16',
						},
						'backend2/channel2': {
							name: 'channel2',
							backend: 'backend2',
							description: 'b',
							source: 'tcp://localhost:1002',
							unit: 'B',
							shape: [10],
							type: 'float32',
						},
						'backend3/channel3': {
							name: 'channel3',
							backend: 'backend3',
							description: 'c',
							source: 'tcp://localhost:1003',
							unit: 'C',
							shape: [10, 20],
							type: 'uint16',
						},
					},
				},
			}
			const val = channelsearchSelectors.availableTags(state1)
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

		it('sorts availableTags', () => {
			const state1 = {
				...state,
				channelsearch: {
					...state.channelsearch,
					entities: {
						'backend1/channel1': {
							name: 'channel1',
							backend: 'backend1',
							description: 'a',
							source: 'tcp://localhost:1001',
							unit: 'A',
							shape: [1],
							type: 'uint16',
						},
						'backend2/channel2': {
							name: 'channel2',
							backend: 'backend2',
							description: 'b',
							source: 'tcp://localhost:1002',
							unit: 'B',
							shape: [10],
							type: 'float32',
						},
						'backend3/channel3': {
							name: 'channel3',
							backend: 'backend3',
							description: 'c',
							source: 'tcp://localhost:1003',
							unit: 'C',
							shape: [10, 20],
							type: 'uint16',
						},
					},
				},
			}
			const val = channelsearchSelectors.availableTags(state1)
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

		it('sorts available backends', () => {
			const state1 = {
				...state,
				channelsearch: { ...state.channelsearch, availableBackends: [] },
			}
			const state2 = {
				...state,
				channelsearch: {
					...state.channelsearch,
					availableBackends: ['b', 'c', 'a'],
				},
			}
			expect(channelsearchSelectors.availableBackends(state1)).to.deep.equal([])
			expect(channelsearchSelectors.availableBackends(state2)).to.deep.equal([
				'a',
				'b',
				'c',
			])
		})

		it('retrieves availableBackendsFetching', () => {
			const state1 = {
				...state,
				channelsearch: {
					...state.channelsearch,
					availableBackendsFetching: true,
				},
			}
			const state2 = {
				...state,
				channelsearch: {
					...state.channelsearch,
					availableBackendsFetching: false,
				},
			}
			expect(channelsearchSelectors.availableBackendsFetching(state1)).to.be
				.true
			expect(channelsearchSelectors.availableBackendsFetching(state2)).to.be
				.false
		})

		it('retrieves availableBackendsError', () => {
			const state1 = {
				...state,
				channelsearch: {
					...state.channelsearch,
					availableBackendsError: undefined,
				},
			}
			expect(channelsearchSelectors.availableBackendsError(state1)).to.be
				.undefined
			const state2 = {
				...state,
				channelsearch: {
					...state.channelsearch,
					availableBackendsError: new Error('example error'),
				},
			}
			const err = channelsearchSelectors.availableBackendsError(state2)!
			expect(err).to.be.instanceOf(Error)
			expect(err.message).to.equal('example error')
		})

		it('retrieves selected backends', () => {
			const state1 = {
				...state,
				channelsearch: { ...state.channelsearch, selectedBackends: [] },
			}
			const state2 = {
				...state,
				channelsearch: {
					...state.channelsearch,
					selectedBackends: ['a', 'b', 'c'],
				},
			}
			expect(channelsearchSelectors.selectedBackends(state1)).to.deep.equal([])
			expect(channelsearchSelectors.selectedBackends(state2)).to.deep.equal([
				'a',
				'b',
				'c',
			])
		})
	})
})
