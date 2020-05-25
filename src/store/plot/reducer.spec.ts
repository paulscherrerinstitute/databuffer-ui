import { describe, it } from 'mocha'
import { expect } from 'chai'

import reducer, { initialState, PlotState } from './reducer'
import { PlotActions } from './actions'
import { YAxis, DataSeries } from './models'
import type { DataResponse } from '../../api/queryrest'

// some fixtures
const EXAMPLE_ERROR = new Error('example error')
const EXAMPLE_CHANNELS = [
	{ name: 'ch1', backend: 'b1' },
	{ name: 'ch2', backend: 'b2' },
	{ name: 'ch3', backend: 'b3' },
	{ name: 'ch4', backend: 'b1' },
]
const EXAMPLE_IDS = ['b1/ch1', 'b2/ch2', 'b3/ch3', 'b1/ch4']
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
				eventCount: 1,
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

describe('plot reducer', () => {
	describe('initial state', () => {
		it('should have correct initial state', () => {
			expect(initialState).to.deep.equal({
				plotTitle: '',
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
				queryRangeShowing: false,
				dialogShareLinkAbsoluteTimes: true,
				dialogShareLinkShowing: false,
			})

			// give it 5 seconds of jitter, because sometimes the startup time
			// of the test runner can break this test
			expect(initialState.startTime).to.be.closeTo(Date.now() - 1000, 5000)
			expect(initialState.endTime).to.be.closeTo(Date.now(), 5000)

			// so rather, just to be sure, check the relative distance of the
			// initial start and end times
			expect(initialState.endTime - initialState.startTime).to.equal(1000)
		})

		it('should return initial state at the beginning', () => {
			expect(reducer(undefined, {} as PlotActions)).to.equal(initialState)
		})
	})

	describe('on action of type SELECT_CHANNEL', () => {
		let nextState: PlotState
		let previousState: PlotState

		beforeEach(() => {
			nextState = { ...initialState }
			const actions = EXAMPLE_CHANNELS.map(c => PlotActions.selectChannel(c))
			// use loop instead of reduce, so we can remember previousState
			for (const action of actions) {
				previousState = nextState
				nextState = reducer(nextState, action)
			}
		})

		describe('channels', () => {
			it('should add to channels', () => {
				expect(nextState).to.have.deep.own.property('channels', [
					EXAMPLE_CHANNELS[0],
					EXAMPLE_CHANNELS[1],
					EXAMPLE_CHANNELS[2],
					EXAMPLE_CHANNELS[3],
				])
			})
		})

		describe('when selecting the channels twice', () => {
			let twiceState: PlotState
			beforeEach(() => {
				// repeat the one from above **again**
				const actions = EXAMPLE_CHANNELS.map(c => PlotActions.selectChannel(c))
				twiceState = actions.reduce(reducer, nextState)
			})

			it('should not add twice to channels', () => {
				expect(twiceState.channels).to.deep.equal(nextState.channels)
			})

			it('should not add twice to yAxes', () => {
				expect(twiceState.yAxes).to.deep.equal(nextState.yAxes)
			})

			it('should not add twice to dataSeries', () => {
				expect(twiceState.dataSeries).to.deep.equal(nextState.dataSeries)
			})
		})

		it('should populate yAxes', () => {
			expect(nextState).to.have.property('yAxes').be.an('array').of.length(4)
		})

		it('should alternate yAxes left, right, left, right, ...', () => {
			expect(nextState.yAxes[0].side).to.equal('left')
			expect(nextState.yAxes[1].side).to.equal('right')
			expect(nextState.yAxes[2].side).to.equal('left')
			expect(nextState.yAxes[3].side).to.equal('right')
		})

		it('should set the yAxes title to be the channel name', () => {
			for (let i = 0; i < nextState.yAxes.length; i++) {
				const y = nextState.yAxes[i]
				expect(y.title).to.equal(
					EXAMPLE_CHANNELS[i].name,
					`title at index ${i} is wrong`
				)
			}
		})

		it('should initialize yAxes unit with an empty string', () => {
			expect(nextState.yAxes[0].unit).to.equal('')
			expect(nextState.yAxes[1].unit).to.equal('')
			expect(nextState.yAxes[2].unit).to.equal('')
			expect(nextState.yAxes[3].unit).to.equal('')
		})

		it('should populate dataSeries', () => {
			expect(nextState)
				.to.have.property('dataSeries')
				.be.an('array')
				.of.length(4)
		})

		it('should set the dataSeries name to be the channel name', () => {
			for (let i = 0; i < nextState.dataSeries.length; i++) {
				const series = nextState.dataSeries[i]
				expect(series.name).to.equal(
					EXAMPLE_CHANNELS[i].name,
					`name at index ${i} is wrong`
				)
			}
		})
	})

	describe('on action of type UNSELECT_CHANNEL', () => {
		let nextState: PlotState
		let previousState: PlotState
		beforeEach(() => {
			nextState = {
				...initialState,
				channels: [],
				yAxes: [],
			}
			const actions = [
				PlotActions.selectChannel(EXAMPLE_CHANNELS[0]),
				PlotActions.selectChannel(EXAMPLE_CHANNELS[1]),
				PlotActions.selectChannel(EXAMPLE_CHANNELS[2]),
				PlotActions.selectChannel(EXAMPLE_CHANNELS[3]),
				PlotActions.unselectChannel(1),
			]
			for (const action of actions) {
				previousState = nextState
				nextState = reducer(nextState, action)
			}
		})

		it('should remove from channels', () => {
			expect(nextState).to.have.deep.own.property('channels', [
				EXAMPLE_CHANNELS[0],
				EXAMPLE_CHANNELS[2],
				EXAMPLE_CHANNELS[3],
			])
		})

		it('should re-distribute yAxes left, right', () => {
			expect(nextState.yAxes[0].side).to.equal('left')
			expect(nextState.yAxes[1].side).to.equal('right')
			expect(nextState.yAxes[2].side).to.equal('left')
		})

		it('should move yAxes up 1 slot after the index', () => {
			const expectedAxes: YAxis[] = [
				previousState.yAxes[0],
				// side needs re-adjusting (see previous test)
				{ ...previousState.yAxes[2], side: 'right' },
				{ ...previousState.yAxes[3], side: 'left' },
			]
			expect(nextState.yAxes).to.deep.equal(expectedAxes)
		})

		it('should move dataSeries up 1 slot after the index', () => {
			const expectedSeries: DataSeries[] = [
				previousState.dataSeries[0],
				// channelIndex and yAxisIndex need re-adjusting
				{ ...previousState.dataSeries[2], channelIndex: 1, yAxisIndex: 1 },
				{ ...previousState.dataSeries[3], channelIndex: 2, yAxisIndex: 2 },
			]
			expect(nextState.dataSeries).to.deep.equal(expectedSeries)
		})

		it('should not break on empty selection', () => {
			const previousState = {
				...initialState,
				channels: [],
			}
			const action = PlotActions.unselectChannel(0)
			const nextState = reducer(previousState, action)
			expect(nextState).to.have.deep.own.property('channels', [])
		})
	})

	describe('on action of type SET_SELECTED_CHANNELS', () => {
		let previousState: PlotState
		let nextState: PlotState

		beforeEach(() => {
			previousState = { ...initialState }
			nextState = reducer(
				previousState,
				PlotActions.setSelectedChannels([
					EXAMPLE_CHANNELS[0],
					EXAMPLE_CHANNELS[2],
				])
			)
		})

		it('should set channels', () => {
			const expected = [EXAMPLE_CHANNELS[0], EXAMPLE_CHANNELS[2]]
			expect(nextState.channels).to.deep.equal(expected)
		})

		it('should set yAxes', () => {
			const expected: YAxis[] = [
				{
					title: EXAMPLE_CHANNELS[0].name,
					unit: '',
					side: 'left',
					min: null,
					max: null,
				},
				{
					title: EXAMPLE_CHANNELS[2].name,
					unit: '',
					side: 'right',
					min: null,
					max: null,
				},
			]
			expect(nextState.yAxes).to.deep.equal(expected)
		})

		it('should set dataSeries', () => {
			const expected: DataSeries[] = [
				{ name: EXAMPLE_CHANNELS[0].name, channelIndex: 0, yAxisIndex: 0 },
				{ name: EXAMPLE_CHANNELS[2].name, channelIndex: 1, yAxisIndex: 1 },
			]
			expect(nextState.dataSeries).to.deep.equal(expected)
		})
	})

	describe('on action of type PLOT_TITLE_CHANGE', () => {
		it('should set plotTitle', () => {
			const previousState = { ...initialState }
			const action = PlotActions.plotTitleChange('Hello')
			const nextState = reducer(previousState, action)
			expect(nextState.plotTitle).to.equal('Hello')
		})
	})

	describe('on action of type DATA_SERIES_LABEL_CHANGE', () => {
		it('should set name of dataSeries item', () => {
			const previousState = {
				...initialState,
				dataSeries: [
					{ name: 'series 1', channelIndex: 0, yAxisIndex: 10 },
					{ name: 'series 2', channelIndex: 1, yAxisIndex: 11 },
					{ name: 'series 3', channelIndex: 2, yAxisIndex: 12 },
				],
			} as PlotState
			const action = PlotActions.dataSeriesLabelChange(1, 'Hello')
			const nextState = reducer(previousState, action)
			expect(nextState.dataSeries[1]).to.deep.equal({
				name: 'Hello',
				channelIndex: 1,
				yAxisIndex: 11,
			})
		})
		it('should set title of yAxes item', () => {
			const previousState = {
				...initialState,
				yAxes: [
					{ title: 'series 1', unit: 'A', side: 'left' },
					{ title: 'series 2', unit: 'V', side: 'right' },
					{ title: 'series 3', unit: 'mJ', side: 'left' },
				],
			} as PlotState
			const action = PlotActions.dataSeriesLabelChange(1, 'Hello')
			const nextState = reducer(previousState, action)
			expect(nextState.yAxes[1]).to.deep.equal({
				title: 'Hello',
				unit: 'V',
				side: 'right',
			})
		})
	})

	describe('on action of type START_TIME_CHANGE', () => {
		it('should set startTime', () => {
			const previousState = { ...initialState }
			const action = PlotActions.startTimeChange(12345)
			const nextState = reducer(previousState, action)
			expect(nextState.startTime).to.equal(12345)
		})
	})

	describe('on action of type END_TIME_CHANGE', () => {
		it('should set endTime', () => {
			const previousState = { ...initialState }
			const action = PlotActions.endTimeChange(54321)
			const nextState = reducer(previousState, action)
			expect(nextState.endTime).to.equal(54321)
		})
	})

	describe('on action of type DRAW_PLOT_REQUEST', () => {
		let action
		const actionTime = 9876

		beforeEach(() => {
			action = PlotActions.drawPlotRequest(actionTime)
		})

		it('should set fetching', () => {
			const previousState = {
				...initialState,
				fetching: false,
			}
			const nextState = reducer(previousState, action)
			expect(nextState.fetching).to.be.true
		})

		it('should re-set error', () => {
			const previousState = {
				...initialState,
				error: EXAMPLE_ERROR,
			}
			const nextState = reducer(previousState, action)
			expect(nextState).to.deep.include({ error: null })
		})

		it('should set request', () => {
			const previousState = { ...initialState, request: undefined }
			const nextState = reducer(previousState, action)
			expect(nextState.request).to.deep.equal({
				sentAt: actionTime,
				finishedAt: undefined,
			})
		})

		it('should re-set response', () => {
			const previousState: PlotState = {
				...initialState,
				response: EXAMPLE_RESPONSE,
			}
			const nextState = reducer(previousState, action)
			expect(nextState.response).to.deep.equal([])
		})
	})

	describe('on action of type DRAW_PLOT_FAILURE', () => {
		const endTime = 54321
		const previousState: PlotState = {
			...initialState,
			request: {
				sentAt: 12345,
				finishedAt: undefined,
			},
			error: undefined,
			fetching: true,
		}
		let nextState: PlotState

		beforeEach(() => {
			const action = PlotActions.drawPlotFailure(endTime, EXAMPLE_ERROR)
			nextState = reducer(previousState, action)
		})

		it('should re-set fetching', () => {
			expect(nextState.fetching).to.be.false
		})

		it('should set error', () => {
			expect(nextState).to.have.own.property('error', EXAMPLE_ERROR)
		})

		it('should set request.finishedAt', () => {
			expect(nextState.request.finishedAt).to.equal(endTime)
		})
	})

	describe('on action of type DRAW_PLOT_SUCCESS', () => {
		const endTime = 54321
		const previousState: PlotState = {
			...initialState,
			request: {
				sentAt: 12345,
				finishedAt: undefined,
			},
			error: undefined,
			fetching: true,
		}
		let nextState: PlotState

		beforeEach(() => {
			const action = PlotActions.drawPlotSuccess(endTime, EXAMPLE_RESPONSE)
			nextState = reducer(previousState, action)
		})

		it('should re-set fetching', () => {
			expect(nextState.fetching).to.be.false
		})

		it('should set request.finishedAt', () => {
			expect(nextState.request.finishedAt).to.equal(endTime)
		})

		it('should set response', () => {
			expect(nextState.response).to.deep.equal(EXAMPLE_RESPONSE)
		})
	})

	describe('on action of type TOGGLE_QUERY_RANGE', () => {
		it('should re-set queryRangeShowing, if it is shown', () => {
			const previousState = { ...initialState, queryRangeShowing: true }
			const action = PlotActions.toggleQueryRange()
			const nextState = reducer(previousState, action)
			expect(nextState.queryRangeShowing).to.be.false
		})

		it('should set queryRangeShowing, if it is not shown', () => {
			const previousState = { ...initialState, queryRangeShowing: false }
			const action = PlotActions.toggleQueryRange()
			const nextState = reducer(previousState, action)
			expect(nextState.queryRangeShowing).to.be.true
		})
	})

	describe('on action of type SHOW_QUERY_RANGE', () => {
		it('should set queryRangeShowing, if it is shown', () => {
			const previousState = { ...initialState, queryRangeShowing: true }
			const action = PlotActions.showQueryRange()
			const nextState = reducer(previousState, action)
			expect(nextState.queryRangeShowing).to.be.true
		})

		it('should set queryRangeShowing, if it is not shown', () => {
			const previousState = { ...initialState, queryRangeShowing: false }
			const action = PlotActions.showQueryRange()
			const nextState = reducer(previousState, action)
			expect(nextState.queryRangeShowing).to.be.true
		})
	})

	describe('on action of type HIDE_QUERY_RANGE', () => {
		it('should re-set queryRangeShowing, if it is shown', () => {
			const previousState = { ...initialState, queryRangeShowing: true }
			const action = PlotActions.hideQueryRange()
			const nextState = reducer(previousState, action)
			expect(nextState.queryRangeShowing).to.be.false
		})

		it('should re-set queryRangeShowing, if it is not shown', () => {
			const previousState = { ...initialState, queryRangeShowing: false }
			const action = PlotActions.hideQueryRange()
			const nextState = reducer(previousState, action)
			expect(nextState.queryRangeShowing).to.be.false
		})
	})

	describe('on action of type SHOW_SHARE_LINK', () => {
		it('should set dialogShareLinkShowing, if it is shown', () => {
			const previousState = { ...initialState, dialogShareLinkShowing: true }
			const action = PlotActions.showShareLink()
			const nextState = reducer(previousState, action)
			expect(nextState.dialogShareLinkShowing).to.be.true
		})

		it('should set dialogShareLinkShowing, if it is not shown', () => {
			const previousState = { ...initialState, dialogShareLinkShowing: false }
			const action = PlotActions.showShareLink()
			const nextState = reducer(previousState, action)
			expect(nextState.dialogShareLinkShowing).to.be.true
		})
	})

	describe('on action of type HIDE_SHARE_LINK', () => {
		it('should re-set dialogShareLinkShowing, if it is shown', () => {
			const previousState = { ...initialState, dialogShareLinkShowing: true }
			const action = PlotActions.hideShareLink()
			const nextState = reducer(previousState, action)
			expect(nextState.dialogShareLinkShowing).to.be.false
		})

		it('should re-set dialogShareLinkShowing, if it is not shown', () => {
			const previousState = { ...initialState, dialogShareLinkShowing: false }
			const action = PlotActions.hideShareLink()
			const nextState = reducer(previousState, action)
			expect(nextState.dialogShareLinkShowing).to.be.false
		})
	})

	describe('on action of type SHARE_ABSOLUTE_TIMES', () => {
		it('should set dialogShareLinkAbsoluteTimes, if it is true', () => {
			const previousState = {
				...initialState,
				dialogShareLinkAbsoluteTimes: true,
			}
			const action = PlotActions.shareAbsoluteTimes()
			const nextState = reducer(previousState, action)
			expect(nextState.dialogShareLinkAbsoluteTimes).to.be.true
		})

		it('should set dialogShareLinkAbsoluteTimes, if it is false', () => {
			const previousState = {
				...initialState,
				dialogShareLinkAbsoluteTimes: false,
			}
			const action = PlotActions.shareAbsoluteTimes()
			const nextState = reducer(previousState, action)
			expect(nextState.dialogShareLinkAbsoluteTimes).to.be.true
		})
	})

	describe('on action of type SHARE_RELATIVE_TIME', () => {
		it('should re-set dialogShareLinkAbsoluteTimes, if it is true', () => {
			const previousState = {
				...initialState,
				dialogShareLinkAbsoluteTimes: true,
			}
			const action = PlotActions.shareRelativeTime()
			const nextState = reducer(previousState, action)
			expect(nextState.dialogShareLinkAbsoluteTimes).to.be.false
		})

		it('should re-set dialogShareLinkAbsoluteTimes, if it is false', () => {
			const previousState = {
				...initialState,
				dialogShareLinkAbsoluteTimes: false,
			}
			const action = PlotActions.shareRelativeTime()
			const nextState = reducer(previousState, action)
			expect(nextState.dialogShareLinkAbsoluteTimes).to.be.false
		})
	})

	describe('on action of type SET_AXIS_MIN', () => {
		it('should only change the axis min at the index', () => {
			const previousState: PlotState = {
				...initialState,
				yAxes: [
					{
						title: 'a',
						unit: 'AA',
						side: 'left',
						min: 10,
						max: 20,
					},
					{
						title: 'b',
						unit: 'BB',
						side: 'left',
						min: 100,
						max: 200,
					},
					{
						title: 'c',
						unit: 'CC',
						side: 'left',
						min: 1000,
						max: 2000,
					},
				],
			}
			const action = PlotActions.setAxisMin(1, 4)
			const nextState = reducer(previousState, action)
			expect(nextState.yAxes[0].min).to.equal(10)
			expect(nextState.yAxes[1].min).to.equal(4)
			expect(nextState.yAxes[2].min).to.equal(1000)
		})
	})
	describe('on action of type SET_AXIS_MAX', () => {
		it('should only change the axis max at the index', () => {
			const previousState: PlotState = {
				...initialState,
				yAxes: [
					{
						title: 'a',
						unit: 'AA',
						side: 'left',
						min: 10,
						max: 20,
					},
					{
						title: 'b',
						unit: 'BB',
						side: 'left',
						min: 100,
						max: 200,
					},
					{
						title: 'c',
						unit: 'CC',
						side: 'left',
						min: 1000,
						max: 2000,
					},
				],
			}
			const action = PlotActions.setAxisMax(1, 4)
			const nextState = reducer(previousState, action)
			expect(nextState.yAxes[0].max).to.equal(20)
			expect(nextState.yAxes[1].max).to.equal(4)
			expect(nextState.yAxes[2].max).to.equal(2000)
		})
	})
})
