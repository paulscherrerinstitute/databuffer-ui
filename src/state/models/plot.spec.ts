/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { describe, it } from 'mocha'
import { expect } from 'chai'

import {
	plot,
	PlotState,
	plotSelectors,
	NR_OF_BINS,
	YAxis,
	DataSeries,
	PlotVariation,
} from './plot'
import { Channel, channelToId } from '../../shared/channel'
import { store, AppState, AppDispatch } from '../store'
import { DataResponse } from '../../api/queryrest'
import {
	AggregationResult,
	EventField,
	AggregationOperation,
	AggregationType,
	DataQuery,
	DataResponseFormatType,
	MappingAlignment,
} from '@paulscherrerinstitute/databuffer-query-js/query-data'
import { formatDate } from '../../util'
import sinon from 'sinon'
import { EffectFns, RoutingState } from '@captaincodeman/rdx'
import { createTestEnv, RdxTestEnv } from '../rdx-test-util'
import { parseISO } from 'date-fns'
import { ROUTE } from '../routing'

const EXAMPLE_CHANNELS = [
	{ name: 'channel2', backend: 'backend2' },
	{ name: 'channel3', backend: 'backend2' },
	{ name: 'channel1', backend: 'backend2' },
	{ name: 'channel2', backend: 'backend1' },
	{ name: 'channel1', backend: 'backend3' },
	{ name: 'channel1', backend: 'backend1' },
]

const EXAMPLE_RESPONSE: DataResponse = [
	{
		channel: EXAMPLE_CHANNELS[0],
		data: [
			{
				eventCount: 1,
				globalMillis: 333,
				shape: [1],
				value: {
					min: 1,
					mean: 2,
					max: 3,
				},
			},
		],
	},
	{
		channel: EXAMPLE_CHANNELS[1],
		data: [
			{
				eventCount: 100,
				globalMillis: 335,
				shape: [1],
				value: {
					min: 2,
					mean: 3,
					max: 4,
				},
			},
		],
	},
]

describe('plot model', () => {
	describe('initial state', () => {
		it('plotVariation', () => {
			expect(plot.state.plotVariation).to.equal(PlotVariation.SeparateAxes)
		})

		it('plotTitle', () => {
			expect(plot.state.plotTitle).to.equal('')
		})

		it('startTime and endTime', () => {
			const expectedDuration = 60_000
			// give it 5 seconds of jitter, because sometimes the startup time
			// of the test runner can break this test
			expect(plot.state.startTime).to.be.closeTo(
				Date.now() - expectedDuration,
				5000
			)
			expect(plot.state.endTime).to.be.closeTo(Date.now(), 5000)

			// so rather, just to be sure, check the relative distance of the
			// initial start and end times
			expect(plot.state.endTime - plot.state.startTime).to.equal(
				expectedDuration
			)
		})

		it('channels', () => {
			expect(plot.state.channels).to.be.an('array').of.length(0)
		})

		it('fetching', () => {
			expect(plot.state.fetching).to.be.false
		})

		it('error', () => {
			expect(plot.state.error).to.be.undefined
		})

		it('request', () => {
			expect(plot.state.request).to.deep.equal({
				sentAt: undefined,
				finishedAt: undefined,
			})
		})

		it('response', () => {
			expect(plot.state.response).to.be.an('array').of.length(0)
		})

		it('yAxes', () => {
			expect(plot.state.yAxes).to.be.an('array').of.length(0)
		})

		it('dataSeries', () => {
			expect(plot.state.dataSeries).to.be.an('array').of.length(0)
		})

		it('queryRangeShowing', () => {
			expect(plot.state.queryRangeShowing).to.be.false
		})

		it('dialogShareLinkShowing', () => {
			expect(plot.state.dialogShareLinkShowing).to.be.false
		})

		it('dialogShareLinkAbsoluteTimes', () => {
			expect(plot.state.dialogShareLinkAbsoluteTimes).to.be.true
		})

		it('dialogDownloadShowing', () => {
			expect(plot.state.dialogDownloadShowing).to.be.false
		})

		it('dialogDownloadAggregation', () => {
			expect(plot.state.dialogDownloadAggregation).to.equal('as-is')
		})
	})

	describe('reducers', () => {
		describe('selectChannel', () => {
			it('adds to channels', () => {
				const newState = plot.reducers.selectChannel(plot.state, {
					name: 'a',
					backend: 'b',
				})
				expect(newState.channels).to.deep.equal([{ name: 'a', backend: 'b' }])
			})

			it('adds to yAxes', () => {
				const newState = plot.reducers.selectChannel(plot.state, {
					name: 'a',
					backend: 'b',
				})
				expect(newState.yAxes).to.be.an('array').of.length(1)
				expect(newState.yAxes[0]).to.deep.equal({
					title: 'a',
					unit: '',
					side: 'left',
					min: null,
					max: null,
					type: 'linear',
				})
			})

			it('adds to dataSeries', () => {
				const newState = plot.reducers.selectChannel(plot.state, {
					name: 'a',
					backend: 'b',
				})
				expect(newState.dataSeries).to.be.an('array').of.length(1)
				expect(newState.dataSeries[0]).to.deep.equal({
					channelIndex: 0,
					yAxisIndex: 0,
					name: 'a',
				})
			})

			it('should alternate yAxes left, right, left, right, ...', () => {
				let state = { ...plot.state }
				const channels = [
					{ name: 'c1', backend: 'b1' },
					{ name: 'c2', backend: 'b2' },
					{ name: 'c3', backend: 'b3' },
					{ name: 'c4', backend: 'b4' },
				]
				for (const c of channels) {
					state = plot.reducers.selectChannel(state, c)
				}
				expect(state.yAxes).to.be.an('array').of.length(4)
				expect(state.yAxes[0].side).to.equal('left')
				expect(state.yAxes[1].side).to.equal('right')
				expect(state.yAxes[2].side).to.equal('left')
				expect(state.yAxes[3].side).to.equal('right')
			})

			describe('when calling selectChannel twice', () => {
				let state1: PlotState
				let state2: PlotState
				const channel: Channel = { name: 'a', backend: 'b' }
				beforeEach(() => {
					state1 = plot.reducers.selectChannel(plot.state, channel)
					state2 = plot.reducers.selectChannel(state1, channel)
				})

				it('should not add twice to channels', () => {
					expect(state2.channels).to.deep.equal(state1.channels)
				})

				it('should not add twice to yAxes', () => {
					expect(state2.yAxes).to.deep.equal(state1.yAxes)
				})

				it('should not add twice to dataSeries', () => {
					expect(state2.dataSeries).to.deep.equal(state1.dataSeries)
				})
			})
		})

		it('changePlotVariation sets plotVariation', () => {
			const newState1 = plot.reducers.changePlotVariation(
				plot.state,
				PlotVariation.SeparateAxes
			)
			const newState2 = plot.reducers.changePlotVariation(
				plot.state,
				PlotVariation.SingleAxis
			)
			const newState3 = plot.reducers.changePlotVariation(
				plot.state,
				PlotVariation.SeparatePlots
			)
			expect(newState1.plotVariation).to.equal(PlotVariation.SeparateAxes)
			expect(newState2.plotVariation).to.equal(PlotVariation.SingleAxis)
			expect(newState3.plotVariation).to.equal(PlotVariation.SeparatePlots)
		})

		it('changePlotTitle sets plotTitle', () => {
			const newState = plot.reducers.changePlotTitle(plot.state, 'My Plot')
			expect(newState.plotTitle).to.equal('My Plot')
		})
	})

	describe('effects', () => {
		let rdxTest: RdxTestEnv<AppState, AppDispatch>
		let effects: EffectFns

		beforeEach(() => {
			rdxTest = createTestEnv(store)
			effects = rdxTest.modelEffects(plot)
		})

		afterEach(() => {
			sinon.restore()
			rdxTest.cleanup()
		})

		describe('drawPlot', () => {
			it('triggers drawPlotRequest', async () => {
				const fake = sinon.fake()
				rdxTest.dispatch.plot.drawPlotRequest = fake
				effects.drawPlot()
				expect(fake.callCount).to.equal(1)
			})
		})

		describe('routing/change', () => {
			describe('route plot-single-channel', () => {
				beforeEach(() => {
					// replace the routing, as it will otherwise cause trouble, as
					// there is no real browser...
					// --
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					rdxTest.dispatch.routing.replace = sinon.fake()
				})

				it('sets the selected channels', async () => {
					const fake = sinon.fake()
					rdxTest.dispatch.plot.setSelectedChannels = fake
					const payload: RoutingState<ROUTE> = {
						page: ROUTE.PLOT_SINGLE_CHANEL,
						params: { backend: 'be1', name: 'ch1' },
					}
					await effects['routing/change'](payload)
					expect(fake.callCount).to.equal(1)
					expect(fake.args[0][0]).to.deep.equal([
						{ backend: 'be1', name: 'ch1' },
					])
				})

				it('changes route to /plot', async () => {
					const fake = sinon.fake()
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					rdxTest.dispatch.routing.replace = fake
					const payload: RoutingState<ROUTE> = {
						page: ROUTE.PLOT_SINGLE_CHANEL,
						params: { backend: 'be1', name: 'ch1' },
					}
					await effects['routing/change'](payload)
					expect(fake.callCount).to.equal(1)
					expect(fake.args[0][0]).to.equal('/plot')
				})
			})

			describe('route preselect', () => {
				beforeEach(() => {
					// replace the routing, as it will otherwise cause trouble, as
					// there is no real browser...
					// --
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					rdxTest.dispatch.routing.replace = sinon.fake()
				})

				it('uses the right defaults', async () => {
					const fakeSetSelectedChannels =
						(rdxTest.dispatch.plot.setSelectedChannels = sinon.fake())
					const fakeChangeEndTime = (rdxTest.dispatch.plot.changeEndTime =
						sinon.fake())
					const fakeChangeStartTime = (rdxTest.dispatch.plot.changeStartTime =
						sinon.fake())
					const expectedChannels: Channel[] = []
					const expectedEndTime = Date.now()
					const expectedStartTime = expectedEndTime - 12 * 60 * 60 * 1000 // default = 12 hours
					const payload: RoutingState<ROUTE> = {
						page: ROUTE.PRESELECT,
						params: {},
						queries: {},
					}
					await effects['routing/change'](payload)

					expect(fakeSetSelectedChannels.callCount).to.equal(1)
					expect(fakeSetSelectedChannels.args[0][0]).to.deep.equal(
						expectedChannels
					)

					expect(fakeChangeEndTime.callCount).to.equal(1)
					expect(fakeChangeEndTime.args[0][0]).to.be.closeTo(
						expectedEndTime,
						100
					)

					expect(fakeChangeStartTime.callCount).to.equal(1)
					expect(fakeChangeStartTime.args[0][0]).to.be.closeTo(
						expectedStartTime,
						100
					)
				})

				it('dispatches drawPlot', async () => {
					const fake = sinon.fake()
					rdxTest.dispatch.plot.drawPlot = fake
					const payload: RoutingState<ROUTE> = {
						page: ROUTE.PRESELECT,
						params: {},
						queries: {},
					}
					await effects['routing/change'](payload)
					expect(fake.callCount).to.equal(1)
				})

				it('changes route to /plot', async () => {
					const fake = sinon.fake()
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					rdxTest.dispatch.routing.replace = fake
					const payload: RoutingState<ROUTE> = {
						page: ROUTE.PRESELECT,
						params: {},
						queries: {},
					}
					await effects['routing/change'](payload)
					expect(fake.callCount).to.equal(1)
					expect(fake.args[0][0]).to.equal('/plot')
				})

				it('takes channels from parameters c1...c16', async () => {
					const fake = sinon.fake()
					rdxTest.dispatch.plot.setSelectedChannels = fake
					const expectedChannels: Channel[] = [
						{ backend: 'be16', name: 'ch01' },
						{ backend: 'be15', name: 'ch02' },
						{ backend: 'be14', name: 'ch03' },
						{ backend: 'be13', name: 'ch04' },
						{ backend: 'be12', name: 'ch05' },
						{ backend: 'be11', name: 'ch06' },
						{ backend: 'be10', name: 'ch07' },
						{ backend: 'be09', name: 'ch08' },
						{ backend: 'be08', name: 'ch09' },
						{ backend: 'be07', name: 'ch10' },
						{ backend: 'be06', name: 'ch11' },
						{ backend: 'be05', name: 'ch12' },
						{ backend: 'be04', name: 'ch13' },
						{ backend: 'be03', name: 'ch14' },
						{ backend: 'be02', name: 'ch15' },
						{ backend: 'be01', name: 'ch16' },
					]
					const payload: RoutingState<ROUTE> = {
						page: ROUTE.PRESELECT,
						params: {},
						queries: {},
					}
					for (let i = 0; i < expectedChannels.length; i++) {
						payload.queries![`c${i + 1}`] = channelToId(expectedChannels[i])
					}
					await effects['routing/change'](payload)
					expect(fake.callCount).to.equal(1)
					expect(fake.args[0][0]).to.deep.equal(expectedChannels)
				})

				it('allows gaps in parameters c1...c16', async () => {
					const fake = sinon.fake()
					rdxTest.dispatch.plot.setSelectedChannels = fake
					const expectedChannels: Channel[] = [
						{ backend: 'be01', name: 'ch01' },
						{ backend: 'be02', name: 'ch02' },
						{ backend: 'be03', name: 'ch03' },
					]
					const payload: RoutingState<ROUTE> = {
						page: ROUTE.PRESELECT,
						params: {},
						queries: {
							c4: 'be01/ch01',
							c9: 'be02/ch02',
							c13: 'be03/ch03',
						},
					}
					await effects['routing/change'](payload)
					expect(fake.callCount).to.equal(1)
					expect(fake.args[0][0]).to.deep.equal(expectedChannels)
				})

				it('ignores parameters c0, and c17+', async () => {
					const fake = sinon.fake()
					rdxTest.dispatch.plot.setSelectedChannels = fake
					const expectedChannels: Channel[] = [
						{ backend: 'be01', name: 'ch01' },
						{ backend: 'be02', name: 'ch02' },
					]
					const payload: RoutingState<ROUTE> = {
						page: ROUTE.PRESELECT,
						params: {},
						queries: {
							c0: 'be00/ch00', // should be ignored
							c1: 'be01/ch01', // should be included
							c16: 'be02/ch02', // should be included
							c17: 'be03/ch03', // should be ignored
							c18: 'be04/ch04', // should be ignored
							c19: 'be05/ch05', // should be ignored
						},
					}
					await effects['routing/change'](payload)
					expect(fake.callCount).to.equal(1)
					expect(fake.args[0][0]).to.deep.equal(expectedChannels)
				})

				it('reads parameter endTime as ISO string', async () => {
					const fake = sinon.fake()
					rdxTest.dispatch.plot.changeEndTime = fake
					const payload: RoutingState<ROUTE> = {
						page: ROUTE.PRESELECT,
						params: {},
						queries: {
							endTime: '2020-05-04T12:07:45.234+02:00',
						},
					}
					await effects['routing/change'](payload)
					const expectedEndTime = parseISO(
						payload.queries!.endTime as string
					).getTime()
					expect(fake.callCount).to.equal(1)
					expect(fake.args[0][0]).to.equal(expectedEndTime)
				})

				it('reads parameter startTime as ISO string', async () => {
					const fake = sinon.fake()
					rdxTest.dispatch.plot.changeStartTime = fake
					const payload: RoutingState<ROUTE> = {
						page: ROUTE.PRESELECT,
						params: {},
						queries: {
							startTime: '2020-05-04T11:07:45.123+02:00',
						},
					}
					await effects['routing/change'](payload)
					const expectedStartTime = parseISO(
						payload.queries!.startTime as string
					).getTime()
					expect(fake.callCount).to.equal(1)
					expect(fake.args[0][0]).to.equal(expectedStartTime)
				})

				it('reads parameter endTime as milliseconds', async () => {
					const fake = sinon.fake()
					rdxTest.dispatch.plot.changeEndTime = fake
					const expectedEndTime = 200000
					const payload: RoutingState<ROUTE> = {
						page: ROUTE.PRESELECT,
						params: {},
						queries: {
							endTime: expectedEndTime.toString(),
						},
					}
					await effects['routing/change'](payload)
					expect(fake.callCount).to.equal(1)
					expect(fake.args[0][0]).to.equal(expectedEndTime)
				})

				it('reads parameter startTime as milliseconds', async () => {
					const fake = sinon.fake()
					rdxTest.dispatch.plot.changeStartTime = fake
					const expectedStartTime = 100000
					const payload: RoutingState<ROUTE> = {
						page: ROUTE.PRESELECT,
						params: {},
						queries: {
							startTime: expectedStartTime.toString(),
						},
					}
					await effects['routing/change'](payload)
					expect(fake.callCount).to.equal(1)
					expect(fake.args[0][0]).to.equal(expectedStartTime)
				})

				it('sets start and end time from parameter duration', async () => {
					const duration = 60000 // 1 minute
					const expectedEndTime = Date.now()
					const expectedStartTime = expectedEndTime - duration
					const fakeEndTime = sinon.fake()
					rdxTest.dispatch.plot.changeEndTime = fakeEndTime
					const fakeStartTime = sinon.fake()
					rdxTest.dispatch.plot.changeStartTime = fakeStartTime
					const payload: RoutingState<ROUTE> = {
						page: ROUTE.PRESELECT,
						params: {},
						queries: {
							duration: duration.toString(),
						},
					}
					await effects['routing/change'](payload)
					expect(fakeEndTime.callCount).to.equal(1)
					expect(fakeEndTime.args[0][0]).to.be.closeTo(expectedEndTime, 100)
					expect(fakeStartTime.callCount).to.equal(1)
					expect(fakeStartTime.args[0][0]).to.be.closeTo(expectedStartTime, 100)
				})

				it('endTime has precedence over duration', async () => {
					const fake = sinon.fake()
					rdxTest.dispatch.plot.changeEndTime = fake
					const expectedEndTime = 200000
					const payload: RoutingState<ROUTE> = {
						page: ROUTE.PRESELECT,
						params: {},
						queries: {
							duration: '60000',
							endTime: expectedEndTime.toString(),
						},
					}
					await effects['routing/change'](payload)
					expect(fake.callCount).to.equal(1)
					expect(fake.args[0][0]).to.equal(expectedEndTime)
				})

				it('startTime has precedence over duration', async () => {
					const fake = sinon.fake()
					rdxTest.dispatch.plot.changeStartTime = fake
					const expectedStartTime = 100000
					const payload: RoutingState<ROUTE> = {
						page: ROUTE.PRESELECT,
						params: {},
						queries: {
							duration: '60000',
							startTime: expectedStartTime.toString(),
						},
					}
					await effects['routing/change'](payload)
					expect(fake.callCount).to.equal(1)
					expect(fake.args[0][0]).to.equal(expectedStartTime)
				})

				it('sets labels if defined', async () => {
					const fake = sinon.fake()
					rdxTest.dispatch.plot.changeDataSeriesLabel = fake
					const payload: RoutingState<ROUTE> = {
						page: ROUTE.PRESELECT,
						params: {},
						queries: {
							c1: 'be01/ch01',
							c2: 'be02/ch02',
							l2: 'my label',
							c5: 'be01/ch03',
							l5: 'another label',
							c6: 'be99/ch99',
						},
					}
					await effects['routing/change'](payload)
					expect(fake.callCount).to.equal(2)
					expect(fake.args[0][0]).to.deep.equal({ index: 1, label: 'my label' })
					expect(fake.args[1][0]).to.deep.equal({
						index: 2,
						label: 'another label',
					})
				})

				it('ignores labels without matching channel', async () => {
					const fake = sinon.fake()
					rdxTest.dispatch.plot.changeDataSeriesLabel = fake
					const payload: RoutingState<ROUTE> = {
						page: ROUTE.PRESELECT,
						params: {},
						queries: {
							c6: 'be99/ch99',
							l8: 'index number does not match', // <-- should not have an effect
						},
					}
					await effects['routing/change'](payload)
					// for param `l8` there should not be an effect, as the 8 does not match the 6 (of c6)
					expect(fake.callCount).to.equal(0)
				})

				it('sets axis type if defined', async () => {
					const fake = sinon.fake()
					rdxTest.dispatch.plot.setAxisType = fake
					const payload: RoutingState<ROUTE> = {
						page: ROUTE.PRESELECT,
						params: {},
						queries: {
							c1: 'be01/ch01',
							c2: 'be02/ch02',
							y2: 'logarithmic',
							c5: 'be01/ch03',
							y5: 'linear',
							c6: 'be99/ch99',
						},
					}
					await effects['routing/change'](payload)
					expect(fake.callCount).to.equal(2)
					expect(fake.args[0][0]).to.deep.equal({
						index: 1,
						type: 'logarithmic',
					})
					expect(fake.args[1][0]).to.deep.equal({
						index: 2,
						type: 'linear',
					})
				})

				it('ignores axis type without matching channel', async () => {
					const fake = sinon.fake()
					rdxTest.dispatch.plot.setAxisType = fake
					const payload: RoutingState<ROUTE> = {
						page: ROUTE.PRESELECT,
						params: {},
						queries: {
							c6: 'be99/ch99',
							y8: 'logarithmic', // <-- should not have an effect
						},
					}
					await effects['routing/change'](payload)
					// for param `y8` there should not be an effect, as the 8 does not match the 6 (of c6)
					expect(fake.callCount).to.equal(0)
				})

				it('sets axis min if defined', async () => {
					const fake = sinon.fake()
					rdxTest.dispatch.plot.setAxisMin = fake
					const payload: RoutingState<ROUTE> = {
						page: ROUTE.PRESELECT,
						params: {},
						queries: {
							c1: 'be01/ch01',
							c2: 'be02/ch02',
							min2: '10',
							c5: 'be01/ch03',
							min5: '20',
							c6: 'be99/ch99',
						},
					}
					await effects['routing/change'](payload)
					expect(fake.callCount).to.equal(2)
					expect(fake.args[0][0]).to.deep.equal({ index: 1, min: 10 })
					expect(fake.args[1][0]).to.deep.equal({ index: 2, min: 20 })
				})

				it('ignores axis min without matching channel', async () => {
					const fake = sinon.fake()
					rdxTest.dispatch.plot.setAxisMin = fake
					const payload: RoutingState<ROUTE> = {
						page: ROUTE.PRESELECT,
						params: {},
						queries: {
							c6: 'be99/ch99',
							min8: '10', // <-- should not have an effect
						},
					}
					await effects['routing/change'](payload)
					// for param `min8` there should not be an effect, as the 8 does not match the 6 (of c6)
					expect(fake.callCount).to.equal(0)
				})

				it('sets axis max if defined', async () => {
					const fake = sinon.fake()
					rdxTest.dispatch.plot.setAxisMax = fake
					const payload: RoutingState<ROUTE> = {
						page: ROUTE.PRESELECT,
						params: {},
						queries: {
							c1: 'be01/ch01',
							c2: 'be02/ch02',
							max2: '100',
							c5: 'be01/ch03',
							max5: '200',
							c6: 'be99/ch99',
						},
					}
					await effects['routing/change'](payload)
					expect(fake.callCount).to.equal(2)
					expect(fake.args[0][0]).to.deep.equal({ index: 1, max: 100 })
					expect(fake.args[1][0]).to.deep.equal({ index: 2, max: 200 })
				})

				it('ignores axis max without matching channel', async () => {
					const fake = sinon.fake()
					rdxTest.dispatch.plot.setAxisMax = fake
					const payload: RoutingState<ROUTE> = {
						page: ROUTE.PRESELECT,
						params: {},
						queries: {
							c6: 'be99/ch99',
							max8: 'index number does not match', // <-- should not have an effect
						},
					}
					await effects['routing/change'](payload)
					// for param `max8` there should not be an effect, as the 8 does not match the 6 (of c6)
					expect(fake.callCount).to.equal(0)
				})

				it('sets title if defined', async () => {
					const fake = sinon.fake()
					rdxTest.dispatch.plot.changePlotTitle = fake
					const payload: RoutingState<ROUTE> = {
						page: ROUTE.PRESELECT,
						params: {},
						queries: {
							title: 'my-plot',
						},
					}
					await effects['routing/change'](payload)
					expect(fake.callCount).to.equal(1)
					expect(fake.args[0][0]).to.deep.equal('my-plot')
				})

				it('sets plotVariation if single-axis', async () => {
					const fake = sinon.fake()
					rdxTest.dispatch.plot.changePlotVariation = fake
					const payload: RoutingState<ROUTE> = {
						page: ROUTE.PRESELECT,
						params: {},
						queries: {
							plotVariation: 'single-axis',
						},
					}
					await effects['routing/change'](payload)
					expect(fake.callCount).to.equal(1)
					expect(fake.args[0][0]).to.deep.equal('single-axis')
				})

				it('sets plotVariation if separate-axes', async () => {
					const fake = sinon.fake()
					rdxTest.dispatch.plot.changePlotVariation = fake
					const payload: RoutingState<ROUTE> = {
						page: ROUTE.PRESELECT,
						params: {},
						queries: {
							plotVariation: 'separate-axes',
						},
					}
					await effects['routing/change'](payload)
					expect(fake.callCount).to.equal(1)
					expect(fake.args[0][0]).to.deep.equal('separate-axes')
				})

				it('ignores plotVariation if invalid value', async () => {
					const fake = sinon.fake()
					rdxTest.dispatch.plot.changePlotVariation = fake
					const payload: RoutingState<ROUTE> = {
						page: ROUTE.PRESELECT,
						params: {},
						queries: {
							plotVariation: 'not-a-valid-enum-value',
						},
					}
					await effects['routing/change'](payload)
					expect(fake.callCount).to.equal(0)
				})
			})
		})
	})

	describe('selectors', () => {
		let state: AppState
		beforeEach(() => {
			state = store.state
		})

		it('retrieves plotVariation', () => {
			const state1 = {
				...state,
				plot: { ...state.plot, plotVariation: PlotVariation.SeparateAxes },
			}
			const state2 = {
				...state,
				plot: {
					...state.plot,
					plotVariation: PlotVariation.SingleAxis,
				},
			}
			const state3 = {
				...state,
				plot: {
					...state.plot,
					plotVariation: PlotVariation.SeparatePlots,
				},
			}
			expect(plotSelectors.plotVariation(state1)).to.equal(
				PlotVariation.SeparateAxes
			)
			expect(plotSelectors.plotVariation(state2)).to.equal(
				PlotVariation.SingleAxis
			)
			expect(plotSelectors.plotVariation(state3)).to.equal(
				PlotVariation.SeparatePlots
			)
		})

		it('retrieves plotTitle', () => {
			const state1 = {
				...state,
				plot: { ...state.plot, plotTitle: '' },
			}
			const state2 = {
				...state,
				plot: {
					...state.plot,
					plotTitle: 'Hello, world!',
				},
			}
			expect(plotSelectors.plotTitle(state1)).to.equal('')
			expect(plotSelectors.plotTitle(state2)).to.equal('Hello, world!')
		})

		it('retrieves plotSubTitle', () => {
			const state1: AppState = {
				...state,
				plot: {
					...state.plot,
					request: { ...state.plot.request, finishedAt: undefined },
				},
			}
			const ts = Date.now()
			const state2: AppState = {
				...state,
				plot: {
					...state.plot,
					request: { ...state.plot.request, finishedAt: ts },
				},
			}
			expect(plotSelectors.plotSubTitle(state1)).to.equal('')
			expect(plotSelectors.plotSubTitle(state2)).to.equal(
				`Data retrieved ${formatDate(ts)}`
			)
		})

		it('retrieves startTime', () => {
			const state1 = {
				...state,
				plot: { ...state.plot, startTime: 100 },
			}
			const state2 = {
				...state,
				plot: {
					...state.plot,
					startTime: 200,
				},
			}
			expect(plotSelectors.startTime(state1)).to.equal(100)
			expect(plotSelectors.startTime(state2)).to.equal(200)
		})

		it('retrieves endTime', () => {
			const state1 = {
				...state,
				plot: { ...state.plot, endTime: 100 },
			}
			const state2 = {
				...state,
				plot: {
					...state.plot,
					endTime: 200,
				},
			}
			expect(plotSelectors.endTime(state1)).to.equal(100)
			expect(plotSelectors.endTime(state2)).to.equal(200)
		})

		it('retrieves channels', () => {
			const state1 = {
				...state,
				plot: {
					...state.plot,
					channels: [{ name: 'ch1', backend: 'b1' }],
				},
			}
			const state2 = {
				...state,
				plot: {
					...state.plot,
					channels: [
						{ name: 'ch1', backend: 'b1' },
						{ name: 'ch2', backend: 'b2' },
					],
				},
			}
			expect(plotSelectors.channels(state1)).to.deep.equal(state1.plot.channels)
			expect(plotSelectors.channels(state2)).to.deep.equal(state2.plot.channels)
		})

		it('retrieves error', () => {
			const state1 = {
				...state,
				plot: { ...state.plot, error: undefined },
			}
			const state2 = {
				...state,
				plot: {
					...state.plot,
					error: new Error('example error'),
				},
			}
			expect(plotSelectors.error(state1)).to.be.undefined
			expect(plotSelectors.error(state2)).to.be.instanceOf(Error)
			expect(plotSelectors.error(state2)!.message).to.equal('example error')
		})

		it('retrieves fetching', () => {
			const state1 = {
				...state,
				plot: { ...state.plot, fetching: true },
			}
			const state2 = {
				...state,
				plot: { ...state.plot, fetching: false },
			}
			expect(plotSelectors.fetching(state1)).to.be.true
			expect(plotSelectors.fetching(state2)).to.be.false
		})

		it('retrieves response', () => {
			const state1 = {
				...state,
				plot: { ...state.plot, response: [] },
			}
			const response: DataResponse = [
				{
					channel: { backend: 'b1', name: 'ch1' },
					data: [
						{
							eventCount: 1,
							globalMillis: 100,
							value: { min: 10, mean: 20, max: 30 },
							shape: [1],
						},
					],
				},
			]
			const state2 = {
				...state,
				plot: { ...state.plot, response },
			}
			expect(plotSelectors.response(state1)).to.deep.equal([])
			expect(plotSelectors.response(state2)).to.deep.equal(response)
		})

		it('retrieves requestSentAt', () => {
			const state1 = {
				...state,
				plot: {
					...state.plot,
					request: { sentAt: 100, finishedAt: 300 },
				},
			}
			const state2 = {
				...state,
				plot: {
					...state.plot,
					request: { sentAt: 200, finishedAt: 500 },
				},
			}
			expect(plotSelectors.requestSentAt(state1)).to.equal(100)
			expect(plotSelectors.requestSentAt(state2)).to.equal(200)
		})

		it('retrieves requestFinishedAt', () => {
			const state1 = {
				...state,
				plot: {
					...state.plot,
					request: { sentAt: 100, finishedAt: 300 },
				},
			}
			const state2 = {
				...state,
				plot: {
					...state.plot,
					request: { sentAt: 200, finishedAt: 500 },
				},
			}
			expect(plotSelectors.requestFinishedAt(state1)).to.equal(300)
			expect(plotSelectors.requestFinishedAt(state2)).to.equal(500)
		})

		it('retrieves requestDuration', () => {
			const state1 = {
				...state,
				plot: {
					...state.plot,
					request: { sentAt: 100, finishedAt: 300 },
				},
			}
			const state2 = {
				...state,
				plot: {
					...state.plot,
					request: { sentAt: 200, finishedAt: 500 },
				},
			}
			const state3 = {
				...state,
				plot: {
					...state.plot,
					request: { sentAt: 400, finishedAt: undefined },
				},
			}
			expect(plotSelectors.requestDuration(state1)).to.equal(200)
			expect(plotSelectors.requestDuration(state2)).to.equal(300)
			expect(plotSelectors.requestDuration(state3)).to.be.undefined
		})

		it('retrieves shouldDisplayChart', () => {
			const state1 = {
				...state,
				plot: {
					...state.plot,
					request: { sentAt: 100, finishedAt: undefined },
				},
			}
			const state2 = {
				...state,
				plot: {
					...state.plot,
					request: { sentAt: 200, finishedAt: 500 },
					error: new Error('example error'),
				},
			}
			const state3 = {
				...state,
				plot: {
					...state.plot,
					request: { sentAt: 400, finishedAt: 800 },
				},
			}
			expect(plotSelectors.shouldDisplayChart(state1)).to.exist
			expect(
				plotSelectors.shouldDisplayChart(state1),
				'false, if request not finished'
			).to.be.false
			expect(
				plotSelectors.shouldDisplayChart(state2),
				'false, if request finished with error'
			).to.be.false
			expect(
				plotSelectors.shouldDisplayChart(state3),
				'true, if request finished without error'
			).to.be.true
		})

		it('retrieves channelsWithoutData', () => {
			const state1 = {
				...state,
				plot: {
					...state.plot,
					response: [],
				},
			}
			const state2 = {
				...state,
				plot: {
					...state.plot,
					response: [
						{
							channel: { backend: 'x', name: 'channel-with-data' },
							data: [
								{
									eventCount: 1,
									globalMillis: 1,
									shape: [1],
									value: 1,
								},
							],
						},
						{
							channel: { backend: 'x', name: 'channel-without-data' },
							data: [],
						},
					],
				},
			}

			expect(plotSelectors.channelsWithoutData(state1)).to.deep.equal([])
			expect(plotSelectors.channelsWithoutData(state2)).to.deep.equal([
				{ backend: 'x', name: 'channel-without-data' },
			])
		})

		it('retrieves yAxes', () => {
			const state1 = { ...state, plot: { ...state.plot, yAxes: [] } }
			const state2 = {
				...state,
				plot: {
					...state.plot,
					yAxes: [
						{
							title: 'a',
							unit: 'mA',
							side: 'left',
							min: 10,
							max: 20,
							type: 'linear',
						} as YAxis,
					],
				},
			}
			expect(plotSelectors.yAxes(state1)).to.deep.equal([])
			expect(plotSelectors.yAxes(state2)).to.deep.equal([
				{
					title: 'a',
					unit: 'mA',
					side: 'left',
					min: 10,
					max: 20,
					type: 'linear',
				},
			])
		})

		it('retrieves dataSeriesConfig', () => {
			const state1 = {
				...state,
				plot: { ...state.plot, dataSeries: [] },
			}
			const state2 = {
				...state,
				plot: {
					...state.plot,
					dataSeries: [
						{
							name: 'a',
							channelIndex: 0,
							yAxisIndex: 0,
						} as DataSeries,
					],
				},
			}
			expect(plotSelectors.dataSeriesConfigs(state1)).to.deep.equal([])
			expect(plotSelectors.dataSeriesConfigs(state2)).to.deep.equal([
				{
					name: 'a',
					channelIndex: 0,
					yAxisIndex: 0,
				},
			])
		})

		it('retrieves dataPoints', () => {
			const state1 = {
				...state,
				plot: { ...state.plot, channels: [], response: [] },
			}
			const ch1 = { name: 'ch1', backend: 'b1' }
			const ch2 = { name: 'ch2', backend: 'b2' }
			const response = [
				{
					channel: ch1,
					data: [{ eventCount: 1, globalMillis: 100, value: 42 }],
				},
				{
					channel: ch2,
					data: [
						{
							eventCount: 10,
							globalMillis: 110,
							value: { min: 10, mean: 20, max: 30 },
						},
					],
				},
			]

			const state2 = {
				...state,
				plot: {
					...state.plot,
					channels: [ch1, ch2],
					response,
				},
			}
			expect(plotSelectors.dataPoints(state1)).to.deep.equal([])
			expect(plotSelectors.dataPoints(state2)).to.deep.equal([
				{
					data: [
						{
							eventCount: response[0].data[0].eventCount,
							x: response[0].data[0].globalMillis,
							y: (response[0].data[0].value as AggregationResult).mean,
						},
					],
					needsBinning: false,
					responseIndex: 0,
				},
				{
					data: [
						{
							eventCount: response[1].data[0].eventCount,
							x: response[1].data[0].globalMillis,
							y: (response[1].data[0].value as AggregationResult).mean,
							max: (response[1].data[0].value as AggregationResult).max,
							mean: (response[1].data[0].value as AggregationResult).mean,
							min: (response[1].data[0].value as AggregationResult).min,
						},
					],
					needsBinning: true,
					responseIndex: 1,
				},
			])
		})

		// describe('retrieves highchartsYAxes', () => {
		// 	let state: AppState

		// 	beforeEach(() => {
		// 		state = {
		// 			...store.state,
		// 			plot: {
		// 				...store.state.plot,
		// 				yAxes: [
		// 					{
		// 						title: 'a',
		// 						unit: 'mA',
		// 						side: 'left',
		// 						min: null,
		// 						max: null,
		// 						type: 'linear',
		// 					},
		// 					{
		// 						title: 'b',
		// 						unit: '', // just a number, no unit
		// 						side: 'right',
		// 						min: 3,
		// 						max: 7,
		// 						type: 'logarithmic',
		// 					},
		// 				],
		// 			},
		// 		}
		// 	})

		// 	it('returns empty array when there are no axes', () => {
		// 		const state1 = {
		// 			...state,
		// 			plot: { ...state.plot, yAxes: [] },
		// 		}
		// 		expect(plotSelectors.highchartsYAxes(state1)).to.deep.equal([])
		// 	})

		// 	it('returns one axis per channel for PlotVariation.SeparateAxes', () => {
		// 		const state1 = {
		// 			...state,
		// 			plot: { ...state.plot, plotVariation: PlotVariation.SeparateAxes },
		// 		}
		// 		expect(plotSelectors.highchartsYAxes(state1))
		// 			.to.be.an('array')
		// 			.with.length(2)
		// 	})

		// 	it('returns one axis per channel for PlotVariation.SeparatePlots', () => {
		// 		const state1 = {
		// 			...state,
		// 			plot: { ...state.plot, plotVariation: PlotVariation.SeparatePlots },
		// 		}
		// 		expect(plotSelectors.highchartsYAxes(state1))
		// 			.to.be.an('array')
		// 			.with.length(2)
		// 	})

		// 	it('returns exactly one axis for PlotVariation.SingleAxis', () => {
		// 		const state1 = {
		// 			...state,
		// 			plot: { ...state.plot, plotVariation: PlotVariation.SingleAxis },
		// 		}
		// 		expect(plotSelectors.highchartsYAxes(state1))
		// 			.to.be.an('array')
		// 			.with.length(1)
		// 	})

		// 	it('puts the unit into the label', () => {
		// 		expect(plotSelectors.highchartsYAxes(state)).to.have.nested.property(
		// 			'[0].labels.format',
		// 			`{value} ${state.plot.yAxes[0].unit}`
		// 		)
		// 		expect(plotSelectors.highchartsYAxes(state)).to.have.nested.property(
		// 			'[1].labels.format',
		// 			`{value}`
		// 		)
		// 	})

		// 	it('puts the title into the title text', () => {
		// 		expect(plotSelectors.highchartsYAxes(state)).to.have.nested.property(
		// 			'[0].title.text',
		// 			state.plot.yAxes[0].title
		// 		)
		// 		expect(plotSelectors.highchartsYAxes(state)).to.have.nested.property(
		// 			'[1].title.text',
		// 			state.plot.yAxes[1].title
		// 		)
		// 	})

		// 	it('maps the side correctly', () => {
		// 		expect(plotSelectors.highchartsYAxes(state)).to.have.nested.property(
		// 			'[0].opposite',
		// 			false
		// 		)
		// 		expect(plotSelectors.highchartsYAxes(state)).to.have.nested.property(
		// 			'[1].opposite',
		// 			true
		// 		)
		// 	})

		// 	it('matches the colors of labels and title', () => {
		// 		const labelColors = plotSelectors
		// 			.highchartsYAxes(state)
		// 			.map(x => x.labels?.style?.color)
		// 		expect(plotSelectors.highchartsYAxes(state)).to.have.nested.property(
		// 			'[0].title.style.color',
		// 			labelColors[0]
		// 		)
		// 		expect(plotSelectors.highchartsYAxes(state)).to.have.nested.property(
		// 			'[1].title.style.color',
		// 			labelColors[1]
		// 		)
		// 	})

		// 	it('sets min correctly', () => {
		// 		expect(plotSelectors.highchartsYAxes(state)).to.have.nested.property(
		// 			'[0].min',
		// 			null
		// 		)
		// 		expect(plotSelectors.highchartsYAxes(state)).to.have.nested.property(
		// 			'[1].min',
		// 			3
		// 		)
		// 	})

		// 	it('sets max correctly', () => {
		// 		expect(plotSelectors.highchartsYAxes(state)).to.have.nested.property(
		// 			'[0].max',
		// 			null
		// 		)
		// 		expect(plotSelectors.highchartsYAxes(state)).to.have.nested.property(
		// 			'[1].max',
		// 			7
		// 		)
		// 	})

		// 	it('sets type correctly', () => {
		// 		expect(plotSelectors.highchartsYAxes(state)).to.have.nested.property(
		// 			'[0].type',
		// 			'linear'
		// 		)
		// 		expect(plotSelectors.highchartsYAxes(state)).to.have.nested.property(
		// 			'[1].type',
		// 			'logarithmic'
		// 		)
		// 	})
		// })

		// describe('it retrieves highchartsDataSeries', () => {
		// 	let state: AppState

		// 	beforeEach(() => {
		// 		state = {
		// 			...store.state,
		// 			plot: {
		// 				...store.state.plot,
		// 				channels: EXAMPLE_CHANNELS,
		// 				response: EXAMPLE_RESPONSE,
		// 				dataSeries: [
		// 					{
		// 						name: 'a',
		// 						channelIndex: 0,
		// 						yAxisIndex: 0,
		// 					},
		// 					{
		// 						name: 'b',
		// 						channelIndex: 1,
		// 						yAxisIndex: 1,
		// 					},
		// 				] as DataSeries[],
		// 			},
		// 		}
		// 	})

		// 	it('returns empty array when there are no data series', () => {
		// 		const state1 = {
		// 			...state,
		// 			plot: { ...state.plot, dataSeries: [] },
		// 		}
		// 		expect(plotSelectors.highchartsDataSeries(state1)).to.deep.equal([])
		// 	})

		// 	it('returns correct size array', () => {
		// 		// there are two channels and hence data series
		// 		// response[0] is not binned (eventCount = 1), but response[1] is binned
		// 		// this creates an additional data series **for the plot** to add an
		// 		// area plot of min/max to the background
		// 		expect(plotSelectors.highchartsDataSeries(state))
		// 			.to.be.an('array')
		// 			.with.length(3)
		// 	})

		// 	it('sets data correctly', () => {
		// 		expect(
		// 			plotSelectors.highchartsDataSeries(state)
		// 		).to.have.deep.nested.property('[0].data[0]', {
		// 			eventCount: EXAMPLE_RESPONSE[0].data[0].eventCount,
		// 			x: EXAMPLE_RESPONSE[0].data[0].globalMillis,
		// 			y: (EXAMPLE_RESPONSE[0].data[0].value as AggregationResult).mean,
		// 		})
		// 		expect(
		// 			plotSelectors.highchartsDataSeries(state)
		// 		).to.have.deep.nested.property('[1].data[0]', {
		// 			eventCount: EXAMPLE_RESPONSE[1].data[0].eventCount,
		// 			x: EXAMPLE_RESPONSE[1].data[0].globalMillis,
		// 			y: (EXAMPLE_RESPONSE[1].data[0].value as AggregationResult).mean,
		// 			max: (EXAMPLE_RESPONSE[1].data[0].value as AggregationResult).max,
		// 			mean: (EXAMPLE_RESPONSE[1].data[0].value as AggregationResult).mean,
		// 			min: (EXAMPLE_RESPONSE[1].data[0].value as AggregationResult).min,
		// 		})
		// 	})

		// 	it('sets name of data series', () => {
		// 		expect(
		// 			plotSelectors.highchartsDataSeries(state)
		// 		).to.have.nested.property('[0].name', 'a')
		// 		expect(
		// 			plotSelectors.highchartsDataSeries(state)
		// 		).to.have.nested.property('[1].name', 'b')
		// 	})

		// 	it('sets step to left', () => {
		// 		expect(
		// 			plotSelectors.highchartsDataSeries(state)
		// 		).to.have.nested.property('[0].step', 'left')
		// 		expect(
		// 			plotSelectors.highchartsDataSeries(state)
		// 		).to.have.nested.property('[1].step', 'left')
		// 	})

		// 	it('sets tooltip', () => {
		// 		// non-aggregated value point
		// 		expect(plotSelectors.highchartsDataSeries(state))
		// 			.to.have.nested.property('[0].tooltip.pointFormat')
		// 			.include('{point.y}')
		// 		// aggregated data point
		// 		expect(plotSelectors.highchartsDataSeries(state))
		// 			.to.have.nested.property('[1].tooltip.pointFormat')
		// 			.include('{point.min}')
		// 			.include('{point.mean}')
		// 			.include('{point.max}')
		// 			.and.not.include('{point.y}')
		// 	})

		// 	it('sets type to line', () => {
		// 		expect(
		// 			plotSelectors.highchartsDataSeries(state)
		// 		).to.have.nested.property('[0].type', 'line')
		// 		expect(
		// 			plotSelectors.highchartsDataSeries(state)
		// 		).to.have.nested.property('[1].type', 'line')
		// 	})

		// 	it('sets yAxis index for PlotVariation.SeparateAxes', () => {
		// 		const state1 = {
		// 			...state,
		// 			plot: { ...state.plot, plotVariation: PlotVariation.SeparateAxes },
		// 		}
		// 		expect(
		// 			plotSelectors.highchartsDataSeries(state1)
		// 		).to.have.nested.property('[0].yAxis', 0)
		// 		expect(
		// 			plotSelectors.highchartsDataSeries(state1)
		// 		).to.have.nested.property('[1].yAxis', 1)
		// 	})

		// 	it('sets yAxis index for PlotVariation.SeparatePlots', () => {
		// 		const state1 = {
		// 			...state,
		// 			plot: { ...state.plot, plotVariation: PlotVariation.SeparatePlots },
		// 		}
		// 		expect(
		// 			plotSelectors.highchartsDataSeries(state1)
		// 		).to.have.nested.property('[0].yAxis', 0)
		// 		expect(
		// 			plotSelectors.highchartsDataSeries(state1)
		// 		).to.have.nested.property('[1].yAxis', 0)
		// 	})

		// 	it('sets yAxis index for PlotVariation.SingleAxis', () => {
		// 		const state1 = {
		// 			...state,
		// 			plot: { ...state.plot, plotVariation: PlotVariation.SingleAxis },
		// 		}
		// 		expect(
		// 			plotSelectors.highchartsDataSeries(state1)
		// 		).to.have.nested.property('[0].yAxis', 0)
		// 		expect(
		// 			plotSelectors.highchartsDataSeries(state1)
		// 		).to.have.nested.property('[1].yAxis', 0)
		// 	})
		// })

		// describe('it retrieves highchartsTitle', () => {
		// 	it('uses plotTitle selector', () => {
		// 		const state1 = {
		// 			...state,
		// 			plot: {
		// 				...state.plot,
		// 				channels: EXAMPLE_CHANNELS,
		// 				response: EXAMPLE_RESPONSE,
		// 				plotTitle: 'example plot',
		// 			},
		// 		}
		// 		const expected = { text: plotSelectors.plotTitle(state1) }
		// 		expect(plotSelectors.highchartsTitle(state1)).to.deep.equal(expected)
		// 	})
		// })

		// describe('it retrieves highchartsSubTitle', () => {
		// 	let state: AppState

		// 	beforeEach(() => {
		// 		state = {
		// 			...store.state,
		// 			plot: {
		// 				...store.state.plot,
		// 				channels: EXAMPLE_CHANNELS,
		// 				response: EXAMPLE_RESPONSE,
		// 				request: {
		// 					sentAt: 1590153856725,
		// 					finishedAt: 1590153857725,
		// 				},
		// 			},
		// 		}
		// 	})

		// 	it('uses requestFinishedAt selector', () => {
		// 		const expected = {
		// 			text:
		// 				'Data retrieved ' +
		// 				formatDate(plotSelectors.requestFinishedAt(state)!),
		// 		}
		// 		expect(plotSelectors.highchartsSubTitle(state)).to.deep.equal(expected)
		// 	})

		// 	it('is empty, when request is not finished yet', () => {
		// 		const state1 = { ...state }
		// 		state1.plot.request.finishedAt = undefined
		// 		const expected = { text: '' }
		// 		expect(plotSelectors.highchartsSubTitle(state1)).to.deep.equal(expected)
		// 	})
		// })

		// describe('it retrieves highchartsOptions', () => {
		// 	let state: AppState
		// 	beforeEach(() => {
		// 		state = {
		// 			...store.state,
		// 			plot: {
		// 				...store.state.plot,
		// 				channels: EXAMPLE_CHANNELS,
		// 				response: EXAMPLE_RESPONSE,
		// 				plotTitle: 'Hello',
		// 				yAxes: [
		// 					{
		// 						title: 'Axis 1',
		// 						unit: 'mA',
		// 						side: 'left',
		// 						min: null,
		// 						max: null,
		// 						type: 'linear',
		// 					},
		// 					{
		// 						title: 'Axis 2',
		// 						unit: 'V',
		// 						side: 'right',
		// 						min: null,
		// 						max: null,
		// 						type: 'linear',
		// 					},
		// 				],
		// 				dataSeries: [
		// 					{
		// 						name: 'series 1',
		// 						channelIndex: 0,
		// 						yAxisIndex: 0,
		// 					},
		// 					{
		// 						name: 'series 2',
		// 						channelIndex: 1,
		// 						yAxisIndex: 1,
		// 					},
		// 				],
		// 			},
		// 		}
		// 	})

		// 	it('returns empty configuration when there are is no data', () => {
		// 		const state1 = {
		// 			...store.state,
		// 			plot: { ...store.state.plot, yAxes: [], dataSeries: [] },
		// 		}
		// 		const options = plotSelectors.highchartsOptions(state1)
		// 		expect(options).to.have.nested.property('title.text', '')
		// 		expect(options).to.have.nested.property('subtitle.text', '')
		// 		expect(options)
		// 			.to.have.nested.property('yAxis')
		// 			.to.be.an('array')
		// 			.of.length(0)
		// 		expect(options)
		// 			.to.have.nested.property('series')
		// 			.to.be.an('array')
		// 			.of.length(0)
		// 	})

		// 	it('uses title from other selectors', () => {
		// 		const expected = plotSelectors.highchartsTitle(state)
		// 		expect(plotSelectors.highchartsOptions(state).title).to.deep.equal(
		// 			expected
		// 		)
		// 	})

		// 	it('uses subtitle from other selectors', () => {
		// 		const expected = plotSelectors.highchartsSubTitle(state)
		// 		expect(plotSelectors.highchartsOptions(state).subtitle).to.deep.equal(
		// 			expected
		// 		)
		// 	})

		// 	it('uses series from other selectors', () => {
		// 		const expected = plotSelectors.highchartsDataSeries(state)
		// 		expect(plotSelectors.highchartsOptions(state).series).to.deep.equal(
		// 			expected
		// 		)
		// 	})

		// 	it('uses yAxis from other selectors', () => {
		// 		const expected = plotSelectors.highchartsYAxes(state)
		// 		expect(plotSelectors.highchartsOptions(state).yAxis).to.deep.equal(
		// 			expected
		// 		)
		// 	})
		// })

		it('retrieves queryRangeShowing', () => {
			const state1 = {
				...state,
				plot: {
					...state.plot,
					queryRangeShowing: false,
				},
			}
			const state2 = {
				...state,
				plot: {
					...state.plot,
					queryRangeShowing: true,
				},
			}
			expect(plotSelectors.queryRangeShowing(state1)).to.be.false
			expect(plotSelectors.queryRangeShowing(state2)).to.be.true
		})

		it('retrieves dialogShareLinkShowing', () => {
			const state1 = {
				...state,
				plot: {
					...state.plot,
					dialogShareLinkShowing: false,
				},
			}
			const state2 = {
				...state,
				plot: {
					...state.plot,
					dialogShareLinkShowing: true,
				},
			}
			expect(plotSelectors.dialogShareLinkShowing(state1)).to.be.false
			expect(plotSelectors.dialogShareLinkShowing(state2)).to.be.true
		})

		it('retrieves dialogShareLinkAbsoluteTimes', () => {
			const state1 = {
				...state,
				plot: {
					...state.plot,
					dialogShareLinkAbsoluteTimes: false,
				},
			}
			const state2 = {
				...state,
				plot: {
					...state.plot,
					dialogShareLinkAbsoluteTimes: true,
				},
			}
			expect(plotSelectors.dialogShareLinkAbsoluteTimes(state1)).to.be.false
			expect(plotSelectors.dialogShareLinkAbsoluteTimes(state2)).to.be.true
		})

		it('retrieves dialogShareLinkChannelsTruncated', () => {
			let state1: AppState = {
				...state,
				plot: {
					...state.plot,
					channels: [],
				},
			}
			for (let i = 1; i <= 16; i++) {
				// need to create a new state object because of memoization in selector
				state1 = {
					...state1,
					plot: {
						...state1.plot,
						channels: [
							...state1.plot.channels,
							{ backend: 'bbb', name: `chan-${i}` },
						],
					},
				}
				expect(plotSelectors.dialogShareLinkChannelsTruncated(state1)).to.be
					.false
			}
			// need to create a new state object because of memoization in selector
			state1 = {
				...state1,
				plot: {
					...state1.plot,
					channels: [
						...state1.plot.channels,
						{ backend: 'bbb', name: `chan-17` },
					],
				},
			}
			expect(state1.plot.channels.length).to.equal(17)
			expect(plotSelectors.dialogShareLinkChannelsTruncated(state1)).to.be.true
		})

		describe('it retrieves dialogShareLinkUrl', () => {
			let state: AppState
			beforeEach(() => {
				state = {
					...store.state,
					plot: {
						...store.state.plot,
						dataSeries: EXAMPLE_CHANNELS.map((ch, idx) => ({
							name: ch.name,
							channelIndex: idx,
							yAxisIndex: idx,
						})),
						yAxes: EXAMPLE_CHANNELS.map((ch, idx) => ({
							title: ch.name,
							side: idx % 2 === 0 ? 'left' : 'right',
							unit: '',
							min: null,
							max: null,
							type: 'linear',
						})),
						channels: EXAMPLE_CHANNELS,
						startTime: 100000,
						endTime: 300000,
						dialogShareLinkAbsoluteTimes: true,
					},
				}
			})

			it('is goes to /preselect', () => {
				expect(plotSelectors.dialogShareLinkUrl(state))
					.to.be.a('string')
					.that.contains('/preselect?')
			})

			it('uses startTime and endTime when absolute times are used', () => {
				state.plot.dialogShareLinkAbsoluteTimes = true
				const url = plotSelectors.dialogShareLinkUrl(state)
				const params = new URLSearchParams(url.split('?', 2)[1])
				expect(params.has('startTime')).to.be.true
				expect(params.has('endTime')).to.be.true
				expect(params.has('duration')).to.be.false
			})

			it('uses duration when relative time is used', () => {
				state.plot.dialogShareLinkAbsoluteTimes = false
				const url = plotSelectors.dialogShareLinkUrl(state)
				const params = new URLSearchParams(url.split('?', 2)[1])
				expect(params.has('startTime')).to.be.false
				expect(params.has('endTime')).to.be.false
				expect(params.has('duration')).to.be.true
			})

			it('sets parameter startTime correctly', () => {
				const url = plotSelectors.dialogShareLinkUrl(state)
				const params = new URLSearchParams(url.split('?', 2)[1])
				expect(params.has('startTime')).to.be.true
				expect(params.get('startTime')).to.equal('100000')
			})

			it('sets parameter endTime correctly', () => {
				const url = plotSelectors.dialogShareLinkUrl(state)
				const params = new URLSearchParams(url.split('?', 2)[1])
				expect(params.has('endTime')).to.be.true
				expect(params.get('endTime')).to.equal('300000')
			})

			it('sets parameter duration correctly', () => {
				state.plot.dialogShareLinkAbsoluteTimes = false
				const url = plotSelectors.dialogShareLinkUrl(state)
				const params = new URLSearchParams(url.split('?', 2)[1])
				expect(params.has('duration')).to.be.true
				expect(params.get('duration')).to.equal('200000')
			})

			it('sets parameters c1...c6 correctly', () => {
				const url = plotSelectors.dialogShareLinkUrl(state)
				const params = new URLSearchParams(url.split('?', 2)[1])
				const expectedValues = state.plot.channels.map(c => channelToId(c))
				for (let i = 0; i < expectedValues.length; i++) {
					expect(params.has(`c${i + 1}`)).to.be.true
					expect(params.get(`c${i + 1}`)).to.equal(expectedValues[i])
				}
			})

			it('supports only up to 16 channels', () => {
				// populate state with 20 channels
				// that would be c1...c20, if it didn't cut off
				state.plot.channels = [
					{ backend: 'my-backend', name: 'chan01' },
					{ backend: 'my-backend', name: 'chan02' },
					{ backend: 'my-backend', name: 'chan03' },
					{ backend: 'my-backend', name: 'chan04' },
					{ backend: 'my-backend', name: 'chan05' },
					{ backend: 'my-backend', name: 'chan06' },
					{ backend: 'my-backend', name: 'chan07' },
					{ backend: 'my-backend', name: 'chan08' },
					{ backend: 'my-backend', name: 'chan09' },
					{ backend: 'my-backend', name: 'chan10' },
					{ backend: 'my-backend', name: 'chan11' },
					{ backend: 'my-backend', name: 'chan12' },
					{ backend: 'my-backend', name: 'chan13' },
					{ backend: 'my-backend', name: 'chan14' },
					{ backend: 'my-backend', name: 'chan15' },
					{ backend: 'my-backend', name: 'chan16' },
					{ backend: 'my-backend', name: 'chan17' },
					{ backend: 'my-backend', name: 'chan18' },
					{ backend: 'my-backend', name: 'chan19' },
					{ backend: 'my-backend', name: 'chan20' },
				]
				const url = plotSelectors.dialogShareLinkUrl(state)
				const params = new URLSearchParams(url.split('?', 2)[1])
				for (let i = 1; i <= 16; i++) {
					expect(params.has(`c${i}`)).to.be.true
				}
				for (let i = 17; i <= 20; i++) {
					expect(params.has(`c${i}`)).to.be.false
				}
			})

			it('does not include l1...l16 if the dataSeries.name == channel.name', () => {
				const url = plotSelectors.dialogShareLinkUrl(state)
				const params = new URLSearchParams(url.split('?', 2)[1])
				for (let i = 1; i <= 16; i++) {
					expect(params.has(`l${i}`)).to.be.false
				}
			})

			it('does include l1...l16 if the dataSeries.name != channel.name', () => {
				state.plot.dataSeries[2].name = 'custom-label-1'
				state.plot.dataSeries[4].name = 'custom-label-2'
				const url = plotSelectors.dialogShareLinkUrl(state)
				const params = new URLSearchParams(url.split('?', 2)[1])
				expect(params.has(`l3`)).to.be.true
				expect(params.get(`l3`)).to.equal('custom-label-1')
				expect(params.has(`l5`)).to.be.true
				expect(params.get(`l5`)).to.equal('custom-label-2')
			})

			it('does not include y1...y16 if the yAxis.type == linear', () => {
				const url = plotSelectors.dialogShareLinkUrl(state)
				const params = new URLSearchParams(url.split('?', 2)[1])
				for (let i = 1; i <= 16; i++) {
					expect(params.has(`y${i}`)).to.be.false
				}
			})

			it('does include y1...y16 if the yAxis.type != linear', () => {
				state.plot.yAxes[2].type = 'logarithmic'
				state.plot.yAxes[4].type = 'logarithmic'
				const url = plotSelectors.dialogShareLinkUrl(state)
				const params = new URLSearchParams(url.split('?', 2)[1])
				expect(params.has(`y3`)).to.be.true
				expect(params.get(`y3`)).to.equal('logarithmic')
				expect(params.has(`y5`)).to.be.true
				expect(params.get(`y5`)).to.equal('logarithmic')
			})

			it('does not include min1...min16 if the yAxis.min == null', () => {
				const url = plotSelectors.dialogShareLinkUrl(state)
				const params = new URLSearchParams(url.split('?', 2)[1])
				for (let i = 1; i <= 16; i++) {
					expect(params.has(`min${i}`)).to.be.false
				}
			})

			it('does include min1...min16 if the yAxis.min != null', () => {
				state.plot.yAxes[2].min = 10
				state.plot.yAxes[4].min = 20
				const url = plotSelectors.dialogShareLinkUrl(state)
				const params = new URLSearchParams(url.split('?', 2)[1])
				expect(params.has(`min3`)).to.be.true
				expect(params.get(`min3`)).to.equal('10')
				expect(params.has(`min5`)).to.be.true
				expect(params.get(`min5`)).to.equal('20')
			})

			it('does not include max1...max16 if the yAxis.max == null', () => {
				const url = plotSelectors.dialogShareLinkUrl(state)
				const params = new URLSearchParams(url.split('?', 2)[1])
				for (let i = 1; i <= 16; i++) {
					expect(params.has(`max${i}`)).to.be.false
				}
			})

			it('does include max1...max16 if the yAxis.max != null', () => {
				state.plot.yAxes[2].max = 10
				state.plot.yAxes[4].max = 20
				const url = plotSelectors.dialogShareLinkUrl(state)
				const params = new URLSearchParams(url.split('?', 2)[1])
				expect(params.has(`max3`)).to.be.true
				expect(params.get(`max3`)).to.equal('10')
				expect(params.has(`max5`)).to.be.true
				expect(params.get(`max5`)).to.equal('20')
			})

			it('does not include plotTitle if it is not set', () => {
				const url = plotSelectors.dialogShareLinkUrl(state)
				const params = new URLSearchParams(url.split('?', 2)[1])
				expect(params.has(`title`)).to.be.false
			})

			it('includes plotTitle if it is set', () => {
				state.plot.plotTitle = 'my-plot'
				const url = plotSelectors.dialogShareLinkUrl(state)
				const params = new URLSearchParams(url.split('?', 2)[1])
				expect(params.has(`title`)).to.be.true
				expect(params.get(`title`)).to.equal('my-plot')
			})

			it('includes plotVariation separate-axes', () => {
				state.plot.plotVariation = PlotVariation.SeparateAxes
				const url = plotSelectors.dialogShareLinkUrl(state)
				const params = new URLSearchParams(url.split('?', 2)[1])
				expect(params.has(`plotVariation`)).to.be.true
				expect(params.get(`plotVariation`)).to.equal('separate-axes')
			})

			it('includes plotVariation separate-plots', () => {
				state.plot.plotVariation = PlotVariation.SeparatePlots
				const url = plotSelectors.dialogShareLinkUrl(state)
				const params = new URLSearchParams(url.split('?', 2)[1])
				expect(params.has(`plotVariation`)).to.be.true
				expect(params.get(`plotVariation`)).to.equal('separate-plots')
			})

			it('includes plotVariation single-axis', () => {
				state.plot.plotVariation = PlotVariation.SingleAxis
				const url = plotSelectors.dialogShareLinkUrl(state)
				const params = new URLSearchParams(url.split('?', 2)[1])
				expect(params.has(`plotVariation`)).to.be.true
				expect(params.get(`plotVariation`)).to.equal('single-axis')
			})
		})

		it('retrieves dialogDownloadShowing', () => {
			const state1 = {
				...state,
				plot: {
					...state.plot,
					dialogDownloadShowing: false,
				},
			}
			const state2 = {
				...state,
				plot: {
					...state.plot,
					dialogDownloadShowing: true,
				},
			}
			expect(plotSelectors.dialogDownloadShowing(state1)).to.be.false
			expect(plotSelectors.dialogDownloadShowing(state2)).to.be.true
		})

		it('retrieves dialogDownloadAggregation', () => {
			const state1: AppState = {
				...state,
				plot: {
					...state.plot,
					dialogDownloadAggregation: 'as-is',
				},
			}
			const state2: AppState = {
				...state,
				plot: {
					...state.plot,
					dialogDownloadAggregation: 'raw',
				},
			}
			expect(plotSelectors.dialogDownloadAggregation(state1)).to.equal('as-is')
			expect(plotSelectors.dialogDownloadAggregation(state2)).to.equal('raw')
		})

		it('retrieves plotQuery', () => {
			const state1: AppState = {
				...state,
				plot: {
					...state.plot,
					channels: [...EXAMPLE_CHANNELS],
					startTime: 100_000,
					endTime: 200_000,
				},
			}
			expect(plotSelectors.plotQuery(state1)).to.deep.equal({
				channels: [...EXAMPLE_CHANNELS],
				range: {
					startSeconds: 100,
					endSeconds: 200,
				},
				eventFields: [
					EventField.GLOBAL_MILLIS,
					EventField.VALUE,
					EventField.EVENT_COUNT,
				],
				aggregation: {
					aggregationType: AggregationType.VALUE,
					aggregations: [
						AggregationOperation.MAX,
						AggregationOperation.MEAN,
						AggregationOperation.MIN,
					],
					nrOfBins: NR_OF_BINS,
				},
			} as DataQuery)
		})

		describe('retrieves downloadQuery', () => {
			let state: AppState

			beforeEach(() => {
				state = {
					...store.state,
					plot: {
						...store.state.plot,
						channels: [...EXAMPLE_CHANNELS],
						startTime: 100_000,
						endTime: 200_000,
						dialogDownloadAggregation: 'PT1M',
					},
				}
			})

			it('sets fields correctly', () => {
				const query = plotSelectors.downloadQuery(state)
				expect(query).to.deep.equal({
					channels: [...EXAMPLE_CHANNELS],
					range: {
						startSeconds: 100,
						endSeconds: 200,
					},
					eventFields: [
						EventField.GLOBAL_DATE,
						EventField.VALUE,
						EventField.EVENT_COUNT,
					],
					aggregation: {
						aggregationType: AggregationType.VALUE,
						aggregations: [
							AggregationOperation.MAX,
							AggregationOperation.MEAN,
							AggregationOperation.MIN,
						],
						durationPerBin: 'PT1M',
					},
					response: {
						format: DataResponseFormatType.CSV,
					},
					mapping: {
						alignment: MappingAlignment.BY_TIME,
					},
				} as DataQuery)
			})

			it('recognizes aggregation "raw"', () => {
				state.plot.dialogDownloadAggregation = 'raw'
				const query = plotSelectors.downloadQuery(state)
				expect(query).not.to.haveOwnProperty('aggregation')
			})

			it('recognizes aggregation "as-is"', () => {
				state.plot.dialogDownloadAggregation = 'as-is'
				const query = plotSelectors.downloadQuery(state)
				expect(query).to.haveOwnProperty('aggregation')
				expect(query.aggregation).not.to.haveOwnProperty('durationPerBin')
				expect(query.aggregation).to.haveOwnProperty('nrOfBins')
				expect(query.aggregation!.nrOfBins).to.equal(NR_OF_BINS)
			})

			it('recognizes aggregation "PT5S"', () => {
				state.plot.dialogDownloadAggregation = 'PT5S'
				const query = plotSelectors.downloadQuery(state)
				expect(query).to.haveOwnProperty('aggregation')
				expect(query.aggregation).not.to.haveOwnProperty('nrOfBins')
				expect(query.aggregation).to.haveOwnProperty('durationPerBin')
				expect(query.aggregation!.durationPerBin).to.equal('PT5S')
			})

			it('recognizes aggregation "PT1M"', () => {
				state.plot.dialogDownloadAggregation = 'PT1M'
				const query = plotSelectors.downloadQuery(state)
				expect(query).to.haveOwnProperty('aggregation')
				expect(query.aggregation).not.to.haveOwnProperty('nrOfBins')
				expect(query.aggregation).to.haveOwnProperty('durationPerBin')
				expect(query.aggregation!.durationPerBin).to.equal('PT1M')
			})

			it('recognizes aggregation "PT1H"', () => {
				state.plot.dialogDownloadAggregation = 'PT1H'
				const query = plotSelectors.downloadQuery(state)
				expect(query).to.haveOwnProperty('aggregation')
				expect(query.aggregation).not.to.haveOwnProperty('nrOfBins')
				expect(query.aggregation).to.haveOwnProperty('durationPerBin')
				expect(query.aggregation!.durationPerBin).to.equal('PT1H')
			})
		})

		describe('retrieves dialogDownloadCurlCommand', () => {
			let state: AppState
			let cmd: string

			beforeEach(() => {
				window.DatabufferUi = {
					TITLE: 'unit test ui',
					QUERY_API: 'http://localhost:8080/query-api',
					DISPATCHER_API: 'http://localhost:8080/dispatcher-api',
					CONTACT_EMAIL: 'test@example.org',
				}
				state = {
					...store.state,
					plot: {
						...store.state.plot,
						channels: [...EXAMPLE_CHANNELS],
						startTime: 100_000,
						endTime: 200_000,
						dialogDownloadAggregation: 'PT1M',
					},
				}
				cmd = plotSelectors.dialogDownloadCurlCommand(state)
			})

			it('starts with curl', () => {
				expect(cmd)
					.to.be.a('string')
					.that.matches(/^curl /)
			})

			it('follows redirects', () => {
				expect(cmd).to.contain('-L')
			})

			it('uses HTTP method POST', () => {
				expect(cmd).to.contain('-X POST')
			})

			it('uses mime type application/json', () => {
				expect(cmd).to.contain("-H 'Content-Type: application/json'")
			})

			it('contains downloadQuery as payload', () => {
				const q = plotSelectors.downloadQuery(state)
				expect(cmd).to.contain(`-d '${JSON.stringify(q)}'`)
			})
		})
	})
})
