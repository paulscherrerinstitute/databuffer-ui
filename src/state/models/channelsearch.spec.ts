/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable mocha/no-skipped-tests */

import {
	channelsearch,
	channelsearchSelectors,
	dataShapeDisplay,
	IdToChannelMap,
} from './channelsearch'
import { store, AppDispatch, AppState } from '../store'
import { createTestEnv, RdxTestEnv } from '../rdx-test-util'
import { EffectFns, RoutingState } from '@captaincodeman/rdx'
import { ROUTE } from '../routing'

describe('channelsearch model', () => {
	describe('initial state', () => {
		it('availableBackends === []', () => {
			expect(Array.isArray(channelsearch.state.availableBackends)).toBe(true)
			expect(channelsearch.state.availableBackends.length).toBe(0)
		})
		it('availableBackendsFetching === false', () => {
			expect(channelsearch.state.availableBackendsFetching).toBe(false)
		})
		it('availableBackendsError === undefined', () => {
			expect(channelsearch.state.availableBackendsError).toBeUndefined()
		})
		it('selectedBackends = []', () => {
			expect(Array.isArray(channelsearch.state.selectedBackends)).toBe(true)
			expect(channelsearch.state.selectedBackends.length).toBe(0)
		})
		it('entities', () => {
			expect(channelsearch.state.entities).toBeInstanceOf(Object)
			expect(Object.keys(channelsearch.state.entities).length).toBe(0)
		})
		it('ids === []', () => {
			expect(Array.isArray(channelsearch.state.ids)).toBe(true)
			expect(channelsearch.state.ids.length).toBe(0)
		})
		it('fetching === false', () => {
			expect(channelsearch.state.fetching).toBe(false)
		})
		it('error  === undefined', () => {
			expect(channelsearch.state.error).toBeUndefined()
		})
	})

	describe('reducers', () => {
		describe('patternChange', () => {
			it('sets pattern', () => {
				const newState = channelsearch.reducers.patternChange(
					channelsearch.state,
					'foobar'
				)
				expect(newState.pattern).toBe('foobar')
			})
		})

		describe('availableBackendsRequest', () => {
			it('sets availableBackendsFetching = true', () => {
				const newState = channelsearch.reducers.availableBackendsRequest(
					channelsearch.state
				)
				expect(newState.availableBackendsFetching).toBe(true)
			})
			it('sets availableBackends = []', () => {
				const newState = channelsearch.reducers.availableBackendsRequest(
					channelsearch.state
				)
				expect(Array.isArray(newState.availableBackends)).toBe(true)
				expect(newState.availableBackends.length).toBe(0)
			})
			it('sets availableBackendsError = undefined', () => {
				const newState = channelsearch.reducers.availableBackendsRequest(
					channelsearch.state
				)
				expect(newState.availableBackendsError).toBeUndefined()
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
				expect(newState.availableBackendsFetching).toBe(false)
			})
			it('sets availableBackends', () => {
				const newState = channelsearch.reducers.availableBackendsSuccess(
					channelsearch.state,
					backends
				)
				expect(newState.availableBackends).toEqual(backends)
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
				expect(newState.fetching).toBe(false)
			})
			it('sets error', () => {
				const newState = channelsearch.reducers.availableBackendsError(
					channelsearch.state,
					error
				)
				expect(newState.availableBackendsError).toBeInstanceOf(Error)
				expect(newState.availableBackendsError).toEqual(error)
			})
		})

		describe('searchRequest', () => {
			it('sets fetching = true', () => {
				const newState = channelsearch.reducers.searchRequest(
					channelsearch.state
				)
				expect(newState.fetching).toBe(true)
			})
			it('sets entities = {}', () => {
				const newState = channelsearch.reducers.searchRequest(
					channelsearch.state
				)
				expect(newState.entities).toBeInstanceOf(Object)
				expect(Object.keys(newState.entities).length).toBe(0)
			})
			it('sets ids = []', () => {
				const newState = channelsearch.reducers.searchRequest(
					channelsearch.state
				)
				expect(Array.isArray(newState.ids)).toBe(true)
				expect(newState.ids.length).toBe(0)
			})
			it('sets error = undefined', () => {
				const newState = channelsearch.reducers.searchRequest(
					channelsearch.state
				)
				expect(newState.error).toBeUndefined()
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
						dataType: 't1',
						dataShape: 'scalar',
					},
					'b2/c2': {
						backend: 'b2',
						name: 'c2',
						source: 's2',
						dataType: 't2',
						dataShape: 'scalar',
					},
					'b3/c3': {
						backend: 'b3',
						name: 'c3',
						source: 's3',
						dataType: 't3',
						dataShape: 'scalar',
					},
					'b4/c4': {
						backend: 'b4',
						name: 'c4',
						source: 's4',
						dataType: 't4',
						dataShape: 'scalar',
					},
				}
			})

			it('sets fetching = false', () => {
				const newState = channelsearch.reducers.searchSuccess(
					channelsearch.state,
					entities
				)
				expect(newState.fetching).toBe(false)
			})
			it('sets entities', () => {
				const newState = channelsearch.reducers.searchSuccess(
					channelsearch.state,
					entities
				)
				expect(newState.entities).toEqual(entities)
			})
			it('sets ids', () => {
				const newState = channelsearch.reducers.searchSuccess(
					channelsearch.state,
					entities
				)
				expect(newState.ids).toEqual(['b1/c1', 'b2/c2', 'b3/c3', 'b4/c4'])
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
				expect(newState.fetching).toBe(false)
			})
			it('sets error', () => {
				const newState = channelsearch.reducers.searchFailure(
					channelsearch.state,
					error
				)
				expect(newState.error).toBeInstanceOf(Error)
				expect(newState.error).toEqual(error)
			})
		})
	})

	// ### 2021-08-17 daniel.lauk@psi.ch
	// disable tests with comment. i need to invest time to replace sinon with jest mocks
	//
	// describe('effects', () => {
	// 	let rdxTest: RdxTestEnv<AppState, AppDispatch>
	// 	let effects: EffectFns

	// 	beforeEach(() => {
	// 		rdxTest = createTestEnv(store)
	// 		// need to fake dispatching actions for routing, because jsdom
	// 		// messes things up and tests will fail
	// 		// ---
	// 		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// 		// @ts-ignore
	// 		rdxTest.dispatch.routing.replace = sinon.fake()
	// 		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// 		// @ts-ignore: routing plugin is not added to dispatch somehow.
	// 		rdxTest.dispatch.routing.push = sinon.fake()
	// 		effects = rdxTest.modelEffects(channelsearch)
	// 	})

	// 	afterEach(() => {
	// 		sinon.restore()
	// 		rdxTest.cleanup()
	// 	})

	// 	describe('init', () => {
	// 		it('dispatches availableBackendsRequest', async () => {
	// 			const fake = sinon.fake()
	// 			rdxTest.dispatch.channelsearch.availableBackendsRequest = fake
	// 			await effects.init()
	// 			expect(fake.callCount).toBe(1)
	// 		})
	// 		xit('dispatches availableBackendsSuccess on success', async () => {
	// 			// TODO: implement
	// 		})
	// 		xit('dispatches availableBackendsError on failure', async () => {
	// 			// TODO: implement
	// 		})
	// 	})

	// 	describe('runSearch', () => {
	// 		it('dispatches searchRequest', async () => {
	// 			const fake = sinon.fake()
	// 			rdxTest.dispatch.channelsearch.searchRequest = fake
	// 			await effects.runSearch()
	// 			expect(fake.callCount).toBe(1)
	// 		})

	// 		xit('dispatches searchSuccess on successful search', async () => {
	// 			const fake = sinon.fake()
	// 			rdxTest.dispatch.channelsearch.searchSuccess = fake
	// 			await effects.runSearch()
	// 			expect(fake.callCount).toBe(1)
	// 		})

	// 		xit('dispatches searchFailure on error', async () => {
	// 			const fake = sinon.fake()
	// 			rdxTest.dispatch.channelsearch.searchFailure = fake
	// 			await effects.runSearch()
	// 			expect(fake.callCount).toBe(1)
	// 			console.log(fake.args)
	// 		})

	// 		it('does not change view to channel-search if that is the current view', async () => {
	// 			const fake = sinon.fake()
	// 			rdxTest.dispatch.routing.push = fake
	// 			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// 			// @ts-ignore
	// 			rdxTest.state.routing.page = ROUTE.CHANNEL_SEARCH
	// 			await effects.runSearch()
	// 			expect(fake.callCount).toBe(0)
	// 		})

	// 		it('changes view to channel-search if that is not the current view', async () => {
	// 			const fake = sinon.fake()
	// 			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// 			// @ts-ignore
	// 			rdxTest.dispatch.routing.push = fake
	// 			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// 			// @ts-ignore
	// 			rdxTest.state.routing.page = 'some-other-view'
	// 			await effects.runSearch()
	// 			expect(fake.callCount).toBe(1)
	// 			expect(fake.args[0][0]).toBe('/search')
	// 		})
	// 	})

	// 	describe('routing/change', () => {
	// 		describe('route channel-search', () => {
	// 			it('sets the search pattern', async () => {
	// 				const fake = sinon.fake()
	// 				rdxTest.dispatch.channelsearch.patternChange = fake
	// 				const payload: RoutingState<ROUTE> = {
	// 					page: ROUTE.CHANNEL_SEARCH,
	// 					params: {},
	// 					queries: { q: 'foo' },
	// 				}
	// 				await effects['routing/change'](payload)
	// 				expect(fake.callCount).toBe(1)
	// 				expect(fake.args[0][0]).toBe('foo')
	// 			})

	// 			it('triggers the search', async () => {
	// 				const fake = sinon.fake()
	// 				rdxTest.dispatch.channelsearch.runSearch = fake
	// 				const payload: RoutingState<ROUTE> = {
	// 					page: ROUTE.CHANNEL_SEARCH,
	// 					params: {},
	// 					queries: { q: 'foo' },
	// 				}
	// 				await effects['routing/change'](payload)
	// 				expect(fake.callCount).toBe(1)
	// 			})
	// 		})
	// 	})
	// })

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
			expect(channelsearchSelectors.error(state1)).toBeUndefined()
			const state2 = {
				...state,
				channelsearch: {
					...state.channelsearch,
					error: new Error('example error'),
				},
			}
			const err = channelsearchSelectors.error(state2)!
			expect(err).toBeInstanceOf(Error)
			expect(err.message).toBe('example error')
		})

		it('retrieves fetching', () => {
			const state1 = {
				...state,
				channelsearch: { ...state.channelsearch, fetching: true },
			}
			expect(channelsearchSelectors.fetching(state1)).toBe(true)
			const state2 = {
				...state,
				channelsearch: { ...state.channelsearch, fetching: false },
			}
			expect(channelsearchSelectors.fetching(state2)).toBe(false)
		})

		it('retrieves pattern', () => {
			const state1 = {
				...state,
				channelsearch: { ...state.channelsearch, pattern: '' },
			}
			expect(channelsearchSelectors.pattern(state1)).toEqual('')
			const state2 = {
				...state,
				channelsearch: { ...state.channelsearch, pattern: 'xyz' },
			}
			expect(channelsearchSelectors.pattern(state2)).toEqual('xyz')
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
							dataShape: 'scalar',
							dataType: 'uint16',
						},
						'backend2/channel3': {
							name: 'channel3',
							backend: 'backend2',
							description: 'b',
							source: 'tcp://localhost:1002',
							unit: 'B',
							dataShape: 'scalar',
							dataType: 'float32',
						},
						'backend2/channel1': {
							name: 'channel1',
							backend: 'backend2',
							description: 'c',
							source: 'tcp://localhost:1003',
							unit: 'C',
							dataShape: 'waveform',
							dataType: 'uint16',
						},
						'backend1/channel2': {
							name: 'channel2',
							backend: 'backend1',
							description: 'd',
							source: 'tcp://localhost:1004',
							unit: 'D',
							dataShape: 'waveform',
							dataType: 'float32',
						},
						'backend3/channel1': {
							name: 'channel1',
							backend: 'backend3',
							description: 'e',
							source: 'tcp://localhost:1005',
							unit: 'E',
							dataShape: 'image',
							dataType: 'uint16',
						},
						'backend1/channel1': {
							name: 'channel1',
							backend: 'backend1',
							description: 'f',
							source: 'tcp://localhost:1006',
							unit: 'F',
							dataShape: 'image',
							dataType: 'uint16',
						},
					} as IdToChannelMap,
				},
			}
			expect(
				channelsearchSelectors
					.results(state1)
					.map(x => ({ name: x.name, backend: x.backend }))
			).toEqual([
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
							dataShape: 'scalar',
							dataType: 'uint16',
						},
						'backend2/channel2': {
							name: 'channel2',
							backend: 'backend2',
							description: 'b',
							source: 'tcp://localhost:1002',
							unit: 'B',
							dataShape: 'scalar',
							dataType: 'float32',
						},
					} as IdToChannelMap,
				},
			}
			const val = channelsearchSelectors
				.results(state1)
				.map(x => ({ name: x.name, backend: x.backend, tags: x.tags }))
			expect(Array.isArray(val)).toBe(true)
			expect(val.length).toBe(2)
			expect(val[0].tags).toEqual(expect.arrayContaining(['backend1']))
			expect(val[1].tags).toEqual(expect.arrayContaining(['backend2']))
		})

		it('includes channel type as tag', () => {
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
							dataShape: 'scalar',
							dataType: 'uint16',
						},
						'backend1/channel2': {
							name: 'channel2',
							backend: 'backend1',
							description: 'b',
							source: 'tcp://localhost:1002',
							unit: 'B',
							dataShape: 'waveform',
							dataType: 'float32',
						},
						'backend1/channel3': {
							name: 'channel3',
							backend: 'backend1',
							description: 'c',
							source: 'tcp://localhost:1003',
							unit: 'C',
							dataShape: 'image',
							dataType: 'uint16',
						},
					} as IdToChannelMap,
				},
			}
			const val = channelsearchSelectors
				.results(state1)
				.map(x => ({ name: x.name, backend: x.backend, tags: x.tags }))
			expect(Array.isArray(val)).toBe(true)
			expect(val.length).toBe(3)
			expect(val[0].tags).toEqual(expect.arrayContaining(['uint16']))
			expect(val[1].tags).toEqual(expect.arrayContaining(['float32']))
			expect(val[2].tags).toEqual(expect.arrayContaining(['uint16']))
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
							dataShape: 'scalar',
							dataType: 'uint16',
						},
						'backend1/channel2': {
							name: 'channel2',
							backend: 'backend1',
							description: 'b',
							source: 'tcp://localhost:1002',
							unit: 'B',
							dataShape: 'waveform',
							dataType: 'float32',
						},
						'backend1/channel3': {
							name: 'channel3',
							backend: 'backend1',
							description: 'c',
							source: 'tcp://localhost:1003',
							unit: 'C',
							dataShape: 'image',
							dataType: 'uint16',
						},
					} as IdToChannelMap,
				},
			}
			const val = channelsearchSelectors
				.results(state1)
				.map(x => ({ name: x.name, backend: x.backend, tags: x.tags }))
			expect(Array.isArray(val)).toBe(true)
			expect(val.length).toBe(3)
			expect(val[0].tags).toEqual(
				expect.arrayContaining([dataShapeDisplay.scalar])
			)
			expect(val[1].tags).toEqual(
				expect.arrayContaining([dataShapeDisplay.waveform])
			)
			expect(val[2].tags).toEqual(
				expect.arrayContaining([dataShapeDisplay.image])
			)
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
							dataShape: 'scalar',
							dataType: 'uint16',
						},
						'backend2/channel2': {
							name: 'channel2',
							backend: 'backend2',
							description: 'b',
							source: 'tcp://localhost:1002',
							unit: 'B',
							dataShape: 'waveform',
							dataType: 'float32',
						},
						'backend3/channel3': {
							name: 'channel3',
							backend: 'backend3',
							description: 'c',
							source: 'tcp://localhost:1003',
							unit: 'C',
							dataShape: 'image',
							dataType: 'uint16',
						},
					} as IdToChannelMap,
				},
			}
			const val = channelsearchSelectors.availableTags(state1)
			expect(Array.isArray(val)).toBe(true)
			expect(val).toEqual(
				expect.arrayContaining([
					'backend1',
					'backend2',
					'backend3',
					'float32',
					'uint16',
					dataShapeDisplay.scalar,
					dataShapeDisplay.waveform,
					dataShapeDisplay.image,
				])
			)
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
							dataShape: 'scalar',
							dataType: 'uint16',
						},
						'backend2/channel2': {
							name: 'channel2',
							backend: 'backend2',
							description: 'b',
							source: 'tcp://localhost:1002',
							unit: 'B',
							dataShape: 'waveform',
							dataType: 'float32',
						},
						'backend3/channel3': {
							name: 'channel3',
							backend: 'backend3',
							description: 'c',
							source: 'tcp://localhost:1003',
							unit: 'C',
							dataShape: 'image',
							dataType: 'uint16',
						},
					} as IdToChannelMap,
				},
			}
			const val = channelsearchSelectors.availableTags(state1)
			expect(val).toEqual(
				[
					dataShapeDisplay.scalar,
					dataShapeDisplay.waveform,
					dataShapeDisplay.image,
					'backend1',
					'backend2',
					'backend3',
					'float32',
					'uint16',
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
			expect(channelsearchSelectors.availableBackends(state1)).toEqual([])
			expect(channelsearchSelectors.availableBackends(state2)).toEqual([
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
			expect(channelsearchSelectors.availableBackendsFetching(state1)).toBe(
				true
			)
			expect(channelsearchSelectors.availableBackendsFetching(state2)).toBe(
				false
			)
		})

		it('retrieves availableBackendsError', () => {
			const state1 = {
				...state,
				channelsearch: {
					...state.channelsearch,
					availableBackendsError: undefined,
				},
			}
			expect(
				channelsearchSelectors.availableBackendsError(state1)
			).toBeUndefined()
			const state2 = {
				...state,
				channelsearch: {
					...state.channelsearch,
					availableBackendsError: new Error('example error'),
				},
			}
			const err = channelsearchSelectors.availableBackendsError(state2)!
			expect(err).toBeInstanceOf(Error)
			expect(err.message).toBe('example error')
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
			expect(channelsearchSelectors.selectedBackends(state1)).toEqual([])
			expect(channelsearchSelectors.selectedBackends(state2)).toEqual([
				'a',
				'b',
				'c',
			])
		})
	})
})
