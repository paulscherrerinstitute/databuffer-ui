import { describe, it } from 'mocha'
import { expect } from 'chai'

import * as selectors from './selectors'

import { RootState } from '../reducer'
import { initialState } from './reducer'
import { ChannelSearchState } from '../channelsearch/reducer'
import { RoutingState } from '../routing/reducer'
import type {
	DataResponse,
	AggregationResult,
} from '@psi/databuffer-query-js/query-data'
import { YAxis, DataSeries } from './models'
import { channelToId } from '@psi/databuffer-query-js/channel'
import { formatDate } from '../../util'

const BASE_STATE: RootState = {
	channelSearch: {} as ChannelSearchState,
	plot: initialState,
	route: {} as RoutingState,
}

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

const EXAMPLE_ERROR = new Error('example error')

const EXAMPLE_STATE_WITH_DATA: RootState = {
	...BASE_STATE,
	plot: {
		...BASE_STATE.plot,
		startTime: 1000,
		endTime: 2000,
		startPulse: 30,
		endPulse: 40,
		queryMode: 'time',
		channels: EXAMPLE_CHANNELS,
		fetching: false,
		error: null,
		request: {
			sentAt: 3000,
			finishedAt: 4000,
		},
		response: EXAMPLE_RESPONSE,
		yAxes: [
			//
		],
		dataSeries: [
			//
		],
		queryRangeShowing: false,
	},
}

describe('plot selectors', () => {
	it('retrieves plotTitle', () => {
		const state1 = {
			...BASE_STATE,
			plot: { ...BASE_STATE.plot, plotTitle: '' },
		}
		const state2 = {
			...BASE_STATE,
			plot: {
				...BASE_STATE.plot,
				plotTitle: 'Hello, world!',
			},
		}
		expect(selectors.plotTitle(state1)).to.equal('')
		expect(selectors.plotTitle(state2)).to.equal('Hello, world!')
	})

	it('retrieves startTime', () => {
		const state1 = {
			...BASE_STATE,
			plot: { ...BASE_STATE.plot, startTime: 100 },
		}
		const state2 = {
			...BASE_STATE,
			plot: {
				...BASE_STATE.plot,
				startTime: 200,
			},
		}
		expect(selectors.startTime(state1)).to.equal(100)
		expect(selectors.startTime(state2)).to.equal(200)
	})

	it('retrieves endTime', () => {
		const state1 = {
			...BASE_STATE,
			plot: { ...BASE_STATE.plot, endTime: 100 },
		}
		const state2 = {
			...BASE_STATE,
			plot: {
				...BASE_STATE.plot,
				endTime: 200,
			},
		}
		expect(selectors.endTime(state1)).to.equal(100)
		expect(selectors.endTime(state2)).to.equal(200)
	})

	// it('retrieves startPulse', () => {
	//   const state1 = {
	//     ...BASE_STATE,
	//     plot: { ...BASE_STATE.plot, startPulse: 100 },
	//   }
	//   const state2 = {
	//     ...BASE_STATE,
	//     plot: {
	//       ...BASE_STATE.plot,
	//       startPulse: 200,
	//     },
	//   }
	//   expect(selectors.startPulse(state1)).to.equal(100)
	//   expect(selectors.startPulse(state2)).to.equal(200)
	// })

	// it('retrieves endPulse', () => {
	//   const state1 = {
	//     ...BASE_STATE,
	//     plot: { ...BASE_STATE.plot, endPulse: 100 },
	//   }
	//   const state2 = {
	//     ...BASE_STATE,
	//     plot: {
	//       ...BASE_STATE.plot,
	//       endPulse: 200,
	//     },
	//   }
	//   expect(selectors.endPulse(state1)).to.equal(100)
	//   expect(selectors.endPulse(state2)).to.equal(200)
	// })

	// it('retrieves queryMode', () => {
	//   const state1 = {
	//     ...BASE_STATE,
	//     plot: { ...BASE_STATE.plot, queryMode: 'time' },
	//   }
	//   const state2 = {
	//     ...BASE_STATE,
	//     plot: {
	//       ...BASE_STATE.plot,
	//       queryMode: 'pulse,
	//     },
	//   }
	//   expect(selectors.queryMode(state1)).to.equal('time')
	//   expect(selectors.queryMode(state2)).to.equal('pulse')
	// })

	it('retrieves channels', () => {
		const state1 = {
			...BASE_STATE,
			plot: { ...BASE_STATE.plot, channels: [{ name: 'ch1', backend: 'b1' }] },
		}
		const state2 = {
			...BASE_STATE,
			plot: {
				...BASE_STATE.plot,
				channels: [
					{ name: 'ch1', backend: 'b1' },
					{ name: 'ch2', backend: 'b2' },
				],
			},
		}
		expect(selectors.channels(state1)).to.deep.equal(state1.plot.channels)
		expect(selectors.channels(state2)).to.deep.equal(state2.plot.channels)
	})

	it('retrieves error', () => {
		const state1 = {
			...BASE_STATE,
			plot: { ...BASE_STATE.plot, error: null },
		}
		const state2 = {
			...BASE_STATE,
			plot: {
				...BASE_STATE.plot,
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
			plot: { ...BASE_STATE.plot, fetching: true },
		}
		const state2 = {
			...BASE_STATE,
			plot: { ...BASE_STATE.plot, fetching: false },
		}
		expect(selectors.fetching(state1)).to.be.true
		expect(selectors.fetching(state2)).to.be.false
	})

	it('retrieves response', () => {
		const state1 = {
			...BASE_STATE,
			plot: { ...BASE_STATE.plot, response: [] },
		}
		const state2 = {
			...BASE_STATE,
			plot: { ...BASE_STATE.plot, response: EXAMPLE_RESPONSE },
		}
		expect(selectors.response(state1)).to.deep.equal([])
		expect(selectors.response(state2)).to.deep.equal(EXAMPLE_RESPONSE)
	})

	it('retrieves requestSentAt', () => {
		const state1 = {
			...BASE_STATE,
			plot: {
				...BASE_STATE.plot,
				request: { sentAt: 100, finishedAt: 300 },
			},
		}
		const state2 = {
			...BASE_STATE,
			plot: {
				...BASE_STATE.plot,
				request: { sentAt: 200, finishedAt: 500 },
			},
		}
		expect(selectors.requestSentAt(state1)).to.equal(100)
		expect(selectors.requestSentAt(state2)).to.equal(200)
	})

	it('retrieves requestFinishedAt', () => {
		const state1 = {
			...BASE_STATE,
			plot: {
				...BASE_STATE.plot,
				request: { sentAt: 100, finishedAt: 300 },
			},
		}
		const state2 = {
			...BASE_STATE,
			plot: {
				...BASE_STATE.plot,
				request: { sentAt: 200, finishedAt: 500 },
			},
		}
		expect(selectors.requestFinishedAt(state1)).to.equal(300)
		expect(selectors.requestFinishedAt(state2)).to.equal(500)
	})

	it('retrieves requestDuration', () => {
		const state1 = {
			...BASE_STATE,
			plot: {
				...BASE_STATE.plot,
				request: { sentAt: 100, finishedAt: 300 },
			},
		}
		const state2 = {
			...BASE_STATE,
			plot: {
				...BASE_STATE.plot,
				request: { sentAt: 200, finishedAt: 500 },
			},
		}
		const state3 = {
			...BASE_STATE,
			plot: {
				...BASE_STATE.plot,
				request: { sentAt: 400, finishedAt: undefined },
			},
		}
		expect(selectors.requestDuration(state1)).to.equal(200)
		expect(selectors.requestDuration(state2)).to.equal(300)
		expect(selectors.requestDuration(state3)).to.be.undefined
	})

	it('retrieves shouldDisplayChart', () => {
		const state1 = {
			...BASE_STATE,
			plot: {
				...BASE_STATE.plot,
				request: { sentAt: 100, finishedAt: undefined },
			},
		}
		const state2 = {
			...BASE_STATE,
			plot: {
				...BASE_STATE.plot,
				request: { sentAt: 200, finishedAt: 500 },
				error: EXAMPLE_ERROR,
			},
		}
		const state3 = {
			...BASE_STATE,
			plot: {
				...BASE_STATE.plot,
				request: { sentAt: 400, finishedAt: 800 },
			},
		}
		expect(selectors.shouldDisplayChart(state1)).to.exist
		expect(
			selectors.shouldDisplayChart(state1),
			'false, if request not finished'
		).to.be.false
		expect(
			selectors.shouldDisplayChart(state2),
			'false, if request finished with error'
		).to.be.false
		expect(
			selectors.shouldDisplayChart(state3),
			'true, if request finished without error'
		).to.be.true
	})

	it('retrieves channelsWithoutData', () => {
		const state1 = {
			...BASE_STATE,
			plot: {
				...BASE_STATE.plot,
				response: [],
			},
		}
		const state2 = {
			...BASE_STATE,
			plot: {
				...BASE_STATE.plot,
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

		expect(selectors.channelsWithoutData(state1)).to.deep.equal([])
		expect(selectors.channelsWithoutData(state2)).to.deep.equal([
			{ backend: 'x', name: 'channel-without-data' },
		])
	})

	it('retrieves yAxes', () => {
		const state1 = { ...BASE_STATE, plot: { ...BASE_STATE.plot, yAxes: [] } }
		const state2 = {
			...BASE_STATE,
			plot: {
				...BASE_STATE.plot,
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
		expect(selectors.yAxes(state1)).to.deep.equal([])
		expect(selectors.yAxes(state2)).to.deep.equal([
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
			...BASE_STATE,
			plot: { ...BASE_STATE.plot, dataSeries: [] },
		}
		const state2 = {
			...BASE_STATE,
			plot: {
				...BASE_STATE.plot,
				dataSeries: [
					{
						name: 'a',
						channelIndex: 0,
						yAxisIndex: 0,
					} as DataSeries,
				],
			},
		}
		expect(selectors.dataSeriesConfig(state1)).to.deep.equal([])
		expect(selectors.dataSeriesConfig(state2)).to.deep.equal([
			{
				name: 'a',
				channelIndex: 0,
				yAxisIndex: 0,
			},
		])
	})

	it('retrieves dataPoints', () => {
		const state1 = {
			...BASE_STATE,
			plot: { ...BASE_STATE.plot, channels: [], response: [] },
		}
		const state2 = {
			...BASE_STATE,
			plot: {
				...BASE_STATE.plot,
				channels: EXAMPLE_CHANNELS,
				response: EXAMPLE_RESPONSE,
			},
		}
		expect(selectors.dataPoints(state1)).to.deep.equal([])
		expect(selectors.dataPoints(state2)).to.deep.equal([
			{
				data: [
					{
						eventCount: EXAMPLE_RESPONSE[0].data[0].eventCount,
						x: EXAMPLE_RESPONSE[0].data[0].globalMillis,
						y: (EXAMPLE_RESPONSE[0].data[0].value as AggregationResult).mean,
					},
				],
				needsBinning: false,
				responseIndex: 0,
			},
			{
				data: [
					{
						eventCount: EXAMPLE_RESPONSE[1].data[0].eventCount,
						x: EXAMPLE_RESPONSE[1].data[0].globalMillis,
						y: (EXAMPLE_RESPONSE[1].data[0].value as AggregationResult).mean,
						max: (EXAMPLE_RESPONSE[1].data[0].value as AggregationResult).max,
						mean: (EXAMPLE_RESPONSE[1].data[0].value as AggregationResult).mean,
						min: (EXAMPLE_RESPONSE[1].data[0].value as AggregationResult).min,
					},
				],
				needsBinning: true,
				responseIndex: 1,
			},
			{ data: [], needsBinning: false, responseIndex: -1 },
			{ data: [], needsBinning: false, responseIndex: -1 },
			{ data: [], needsBinning: false, responseIndex: -1 },
			{ data: [], needsBinning: false, responseIndex: -1 },
		])
	})

	describe('retrieves highchartsYAxes', () => {
		let state: RootState

		beforeEach(() => {
			state = {
				...BASE_STATE,
				plot: {
					...BASE_STATE.plot,
					yAxes: [
						{
							title: 'a',
							unit: 'mA',
							side: 'left',
							min: null,
							max: null,
							type: 'linear',
						},
						{
							title: 'b',
							unit: '', // just a number, no unit
							side: 'right',
							min: 3,
							max: 7,
							type: 'logarithmic',
						},
					],
				},
			}
		})

		it('returns empty array when there are no axes', () => {
			const state1 = { ...BASE_STATE, plot: { ...BASE_STATE.plot, yAxes: [] } }
			expect(selectors.highchartsYAxes(state1)).to.deep.equal([])
		})

		it('returns correct size array', () => {
			expect(selectors.highchartsYAxes(state)).to.be.an('array').with.length(2)
		})

		it('puts the unit into the label', () => {
			expect(selectors.highchartsYAxes(state)).to.have.nested.property(
				'[0].labels.format',
				`{value} ${state.plot.yAxes[0].unit}`
			)
			expect(selectors.highchartsYAxes(state)).to.have.nested.property(
				'[1].labels.format',
				`{value}`
			)
		})

		it('puts the title into the title text', () => {
			expect(selectors.highchartsYAxes(state)).to.have.nested.property(
				'[0].title.text',
				state.plot.yAxes[0].title
			)
			expect(selectors.highchartsYAxes(state)).to.have.nested.property(
				'[1].title.text',
				state.plot.yAxes[1].title
			)
		})

		it('maps the side correctly', () => {
			expect(selectors.highchartsYAxes(state)).to.have.nested.property(
				'[0].opposite',
				false
			)
			expect(selectors.highchartsYAxes(state)).to.have.nested.property(
				'[1].opposite',
				true
			)
		})

		it('matches the colors of labels and title', () => {
			const labelColors = selectors
				.highchartsYAxes(state)
				.map(x => x.labels.style.color)
			expect(selectors.highchartsYAxes(state)).to.have.nested.property(
				'[0].title.style.color',
				labelColors[0]
			)
			expect(selectors.highchartsYAxes(state)).to.have.nested.property(
				'[1].title.style.color',
				labelColors[1]
			)
		})

		it('sets min correctly', () => {
			expect(selectors.highchartsYAxes(state)).to.have.nested.property(
				'[0].min',
				null
			)
			expect(selectors.highchartsYAxes(state)).to.have.nested.property(
				'[1].min',
				3
			)
		})

		it('sets max correctly', () => {
			expect(selectors.highchartsYAxes(state)).to.have.nested.property(
				'[0].max',
				null
			)
			expect(selectors.highchartsYAxes(state)).to.have.nested.property(
				'[1].max',
				7
			)
		})

		it('sets type correctly', () => {
			expect(selectors.highchartsYAxes(state)).to.have.nested.property(
				'[0].type',
				'linear'
			)
			expect(selectors.highchartsYAxes(state)).to.have.nested.property(
				'[1].type',
				'logarithmic'
			)
		})
	})

	describe('it retrieves highchartsDataSeries', () => {
		let state: RootState

		beforeEach(() => {
			state = {
				...BASE_STATE,
				plot: {
					...BASE_STATE.plot,
					channels: EXAMPLE_CHANNELS,
					response: EXAMPLE_RESPONSE,
					dataSeries: [
						{
							name: 'a',
							channelIndex: 0,
							yAxisIndex: 0,
						},
						{
							name: 'b',
							channelIndex: 1,
							yAxisIndex: 1,
						},
					] as DataSeries[],
				},
			}
		})

		it('returns empty array when there are no data series', () => {
			const state1 = {
				...BASE_STATE,
				plot: { ...BASE_STATE.plot, dataSeries: [] },
			}
			expect(selectors.highchartsDataSeries(state1)).to.deep.equal([])
		})

		it('returns correct size array', () => {
			// there are two channels and hence data series
			// response[0] is not binned (eventCount = 1), but response[1] is binned
			// this creates an additional data series **for the plot** to add an
			// area plot of min/max to the background
			expect(selectors.highchartsDataSeries(state))
				.to.be.an('array')
				.with.length(3)
		})

		it('sets data correctly', () => {
			expect(
				selectors.highchartsDataSeries(state)
			).to.have.deep.nested.property('[0].data[0]', {
				eventCount: EXAMPLE_RESPONSE[0].data[0].eventCount,
				x: EXAMPLE_RESPONSE[0].data[0].globalMillis,
				y: (EXAMPLE_RESPONSE[0].data[0].value as AggregationResult).mean,
			})
			expect(
				selectors.highchartsDataSeries(state)
			).to.have.deep.nested.property('[1].data[0]', {
				eventCount: EXAMPLE_RESPONSE[1].data[0].eventCount,
				x: EXAMPLE_RESPONSE[1].data[0].globalMillis,
				y: (EXAMPLE_RESPONSE[1].data[0].value as AggregationResult).mean,
				max: (EXAMPLE_RESPONSE[1].data[0].value as AggregationResult).max,
				mean: (EXAMPLE_RESPONSE[1].data[0].value as AggregationResult).mean,
				min: (EXAMPLE_RESPONSE[1].data[0].value as AggregationResult).min,
			})
		})

		it('sets name of data series', () => {
			expect(selectors.highchartsDataSeries(state)).to.have.nested.property(
				'[0].name',
				'a'
			)
			expect(selectors.highchartsDataSeries(state)).to.have.nested.property(
				'[1].name',
				'b'
			)
		})

		it('sets step to left', () => {
			expect(selectors.highchartsDataSeries(state)).to.have.nested.property(
				'[0].step',
				'left'
			)
			expect(selectors.highchartsDataSeries(state)).to.have.nested.property(
				'[1].step',
				'left'
			)
		})

		it('sets tooltip', () => {
			// non-aggregated value point
			expect(selectors.highchartsDataSeries(state))
				.to.have.nested.property('[0].tooltip.pointFormat')
				.include('{point.y}')
			// aggregated data point
			expect(selectors.highchartsDataSeries(state))
				.to.have.nested.property('[1].tooltip.pointFormat')
				.include('{point.min}')
				.include('{point.mean}')
				.include('{point.max}')
				.and.not.include('{point.y}')
		})

		it('sets type to line', () => {
			expect(selectors.highchartsDataSeries(state)).to.have.nested.property(
				'[0].type',
				'line'
			)
			expect(selectors.highchartsDataSeries(state)).to.have.nested.property(
				'[1].type',
				'line'
			)
		})

		it('sets yAxis index', () => {
			expect(selectors.highchartsDataSeries(state)).to.have.nested.property(
				'[0].yAxis',
				0
			)
			expect(selectors.highchartsDataSeries(state)).to.have.nested.property(
				'[1].yAxis',
				1
			)
		})
	})

	describe('it retrieves highchartsTitle', () => {
		it('uses plotTitle selector', () => {
			const state = {
				...BASE_STATE,
				plot: {
					...BASE_STATE.plot,
					channels: EXAMPLE_CHANNELS,
					response: EXAMPLE_RESPONSE,
					plotTitle: 'example plot',
				},
			}
			const expected = { text: selectors.plotTitle(state) }
			expect(selectors.highchartsTitle(state)).to.deep.equal(expected)
		})
	})

	describe('it retrieves highchartsSubTitle', () => {
		let state: RootState

		beforeEach(() => {
			state = {
				...BASE_STATE,
				plot: {
					...BASE_STATE.plot,
					channels: EXAMPLE_CHANNELS,
					response: EXAMPLE_RESPONSE,
					request: {
						sentAt: 1590153856725,
						finishedAt: 1590153857725,
					},
				},
			}
		})

		it('uses requestFinishedAt selector', () => {
			const expected = {
				text:
					'Data retrieved ' + formatDate(selectors.requestFinishedAt(state)),
			}
			expect(selectors.highchartsSubTitle(state)).to.deep.equal(expected)
		})

		it('is empty, when request is not finished yet', () => {
			const state1 = { ...state }
			state1.plot.request.finishedAt = undefined
			const expected = { text: '' }
			expect(selectors.highchartsSubTitle(state1)).to.deep.equal(expected)
		})
	})

	describe('it retrieves highchartsOptions', () => {
		let state: RootState
		beforeEach(() => {
			state = {
				...BASE_STATE,
				plot: {
					...BASE_STATE.plot,
					channels: EXAMPLE_CHANNELS,
					response: EXAMPLE_RESPONSE,
					plotTitle: 'Hello',
					yAxes: [
						{
							title: 'Axis 1',
							unit: 'mA',
							side: 'left',
							min: null,
							max: null,
							type: 'linear',
						},
						{
							title: 'Axis 2',
							unit: 'V',
							side: 'right',
							min: null,
							max: null,
							type: 'linear',
						},
					],
					dataSeries: [
						{
							name: 'series 1',
							channelIndex: 0,
							yAxisIndex: 0,
						},
						{
							name: 'series 2',
							channelIndex: 1,
							yAxisIndex: 1,
						},
					],
				},
			}
		})

		it('returns empty configuration when there are is no data', () => {
			const state1 = {
				...BASE_STATE,
				plot: { ...BASE_STATE.plot, yAxes: [], dataSeries: [] },
			}
			const options = selectors.highchartsOptions(state1)
			expect(options).to.have.nested.property('title.text', '')
			expect(options).to.have.nested.property('subtitle.text', '')
			expect(options)
				.to.have.nested.property('yAxis')
				.to.be.an('array')
				.of.length(0)
			expect(options)
				.to.have.nested.property('series')
				.to.be.an('array')
				.of.length(0)
		})

		it('uses title from other selectors', () => {
			const expected = selectors.highchartsTitle(state)
			expect(selectors.highchartsOptions(state).title).to.deep.equal(expected)
		})

		it('uses subtitle from other selectors', () => {
			const expected = selectors.highchartsSubTitle(state)
			expect(selectors.highchartsOptions(state).subtitle).to.deep.equal(
				expected
			)
		})

		it('uses series from other selectors', () => {
			const expected = selectors.highchartsDataSeries(state)
			expect(selectors.highchartsOptions(state).series).to.deep.equal(expected)
		})

		it('uses yAxis from other selectors', () => {
			const expected = selectors.highchartsYAxes(state)
			expect(selectors.highchartsOptions(state).yAxis).to.deep.equal(expected)
		})
	})

	it('retrieves queryRangeShowing', () => {
		const state1 = {
			...BASE_STATE,
			plot: {
				...BASE_STATE.plot,
				queryRangeShowing: false,
			},
		}
		const state2 = {
			...BASE_STATE,
			plot: {
				...BASE_STATE.plot,
				queryRangeShowing: true,
			},
		}
		expect(selectors.queryRangeShowing(state1)).to.be.false
		expect(selectors.queryRangeShowing(state2)).to.be.true
	})

	it('retrieves dialogShareLinkShowing', () => {
		const state1 = {
			...BASE_STATE,
			plot: {
				...BASE_STATE.plot,
				dialogShareLinkShowing: false,
			},
		}
		const state2 = {
			...BASE_STATE,
			plot: {
				...BASE_STATE.plot,
				dialogShareLinkShowing: true,
			},
		}
		expect(selectors.dialogShareLinkShowing(state1)).to.be.false
		expect(selectors.dialogShareLinkShowing(state2)).to.be.true
	})

	it('retrieves dialogShareLinkAbsoluteTimes', () => {
		const state1 = {
			...BASE_STATE,
			plot: {
				...BASE_STATE.plot,
				dialogShareLinkAbsoluteTimes: false,
			},
		}
		const state2 = {
			...BASE_STATE,
			plot: {
				...BASE_STATE.plot,
				dialogShareLinkAbsoluteTimes: true,
			},
		}
		expect(selectors.dialogShareLinkAbsoluteTimes(state1)).to.be.false
		expect(selectors.dialogShareLinkAbsoluteTimes(state2)).to.be.true
	})

	it('retrieves dialogShareLinkChannelsTruncated', () => {
		let state1 = {
			...BASE_STATE,
			plot: {
				...BASE_STATE.plot,
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
			expect(selectors.dialogShareLinkChannelsTruncated(state1)).to.be.false
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
		expect(selectors.dialogShareLinkChannelsTruncated(state1)).to.be.true
	})

	describe('it retrieves dialogShareLinkUrl', () => {
		let state: RootState
		beforeEach(() => {
			state = {
				...BASE_STATE,
				plot: {
					...BASE_STATE.plot,
					dataSeries: EXAMPLE_CHANNELS.map((ch, idx) => ({
						name: ch.name,
						channelIndex: idx,
						yAxisIndex: idx,
					})),
					channels: EXAMPLE_CHANNELS,
					startTime: 100000,
					endTime: 300000,
					dialogShareLinkAbsoluteTimes: true,
				},
			}
		})

		it('is goes to /preselect', () => {
			expect(selectors.dialogShareLinkUrl(state))
				.to.be.a('string')
				.that.contains('/preselect?')
		})

		it('sets uses startTime and endTime when absolute times are used', () => {
			state.plot.dialogShareLinkAbsoluteTimes = true
			const url = selectors.dialogShareLinkUrl(state)
			const params = new URLSearchParams(url.split('?', 2)[1])
			expect(params.has('startTime')).to.be.true
			expect(params.has('endTime')).to.be.true
			expect(params.has('duration')).to.be.false
		})

		it('sets uses duration when relative time is used', () => {
			state.plot.dialogShareLinkAbsoluteTimes = false
			const url = selectors.dialogShareLinkUrl(state)
			const params = new URLSearchParams(url.split('?', 2)[1])
			expect(params.has('startTime')).to.be.false
			expect(params.has('endTime')).to.be.false
			expect(params.has('duration')).to.be.true
		})

		it('sets parameter startTime correctly', () => {
			const url = selectors.dialogShareLinkUrl(state)
			const params = new URLSearchParams(url.split('?', 2)[1])
			expect(params.has('startTime')).to.be.true
			expect(params.get('startTime')).to.equal('100000')
		})

		it('sets parameter endTime correctly', () => {
			const url = selectors.dialogShareLinkUrl(state)
			const params = new URLSearchParams(url.split('?', 2)[1])
			expect(params.has('endTime')).to.be.true
			expect(params.get('endTime')).to.equal('300000')
		})

		it('sets parameter duration correctly', () => {
			state.plot.dialogShareLinkAbsoluteTimes = false
			const url = selectors.dialogShareLinkUrl(state)
			const params = new URLSearchParams(url.split('?', 2)[1])
			expect(params.has('duration')).to.be.true
			expect(params.get('duration')).to.equal('200000')
		})

		it('sets parameters c1...c6 correctly', () => {
			const url = selectors.dialogShareLinkUrl(state)
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
			const url = selectors.dialogShareLinkUrl(state)
			const params = new URLSearchParams(url.split('?', 2)[1])
			for (let i = 1; i <= 16; i++) {
				expect(params.has(`c${i}`)).to.be.true
			}
			for (let i = 17; i <= 20; i++) {
				expect(params.has(`c${i}`)).to.be.false
			}
		})

		it('does not include l1...l16 if the dataSeries.name == channel.name', () => {
			const url = selectors.dialogShareLinkUrl(state)
			const params = new URLSearchParams(url.split('?', 2)[1])
			for (let i = 1; i <= 16; i++) {
				expect(params.has(`l${i}`)).to.be.false
			}
		})

		it('does include l1...l16 if the dataSeries.name != channel.name', () => {
			state.plot.dataSeries[2].name = 'custom-label-1'
			state.plot.dataSeries[4].name = 'custom-label-2'
			const url = selectors.dialogShareLinkUrl(state)
			const params = new URLSearchParams(url.split('?', 2)[1])
			expect(params.has(`l3`)).to.be.true
			expect(params.get(`l3`)).to.equal('custom-label-1')
			expect(params.has(`l5`)).to.be.true
			expect(params.get(`l5`)).to.equal('custom-label-2')
		})
	})

	it('retrieves dialogDownloadShowing', () => {
		const state1 = {
			...BASE_STATE,
			plot: {
				...BASE_STATE.plot,
				dialogDownloadShowing: false,
			},
		}
		const state2 = {
			...BASE_STATE,
			plot: {
				...BASE_STATE.plot,
				dialogDownloadShowing: true,
			},
		}
		expect(selectors.dialogDownloadShowing(state1)).to.be.false
		expect(selectors.dialogDownloadShowing(state2)).to.be.true
	})

	it('retrieves dialogDownloadAggregation', () => {
		const state1: RootState = {
			...BASE_STATE,
			plot: {
				...BASE_STATE.plot,
				dialogDownloadAggregation: 'as-is',
			},
		}
		const state2: RootState = {
			...BASE_STATE,
			plot: {
				...BASE_STATE.plot,
				dialogDownloadAggregation: 'raw',
			},
		}
		expect(selectors.dialogDownloadAggregation(state1)).to.equal('as-is')
		expect(selectors.dialogDownloadAggregation(state2)).to.equal('raw')
	})
})
