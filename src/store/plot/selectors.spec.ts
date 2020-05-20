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
						} as YAxis,
						{
							title: 'b',
							unit: '', // just a number, no unit
							side: 'right',
						} as YAxis,
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
			expect(selectors.highchartsDataSeries(state))
				.to.be.an('array')
				.with.length(2)
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
				.to.have.nested.property('[0].tooltip')
				.include('value: {point.mean}')
			// aggregated data point
			expect(selectors.highchartsDataSeries(state))
				.to.have.nested.property('[1].tooltip')
				.include('min: {point.min}')
				.include('mean: {point.mean}')
				.include('max: {point.max}')
				.and.not.include('value')
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

	describe('it retrieves highchartsOptions', () => {
		let state: RootState
		beforeEach(() => {
			state = {
				...BASE_STATE,
				plot: {
					...BASE_STATE.plot,
					channels: EXAMPLE_CHANNELS,
					response: EXAMPLE_RESPONSE,
					yAxes: [
						{ title: 'Axis 1', unit: 'mA', side: 'left' },
						{ title: 'Axis 2', unit: 'V', side: 'right' },
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
			expect(selectors.highchartsOptions(state1)).to.deep.equal({
				yAxis: [],
				series: [],
			})
		})

		it('uses series and yAxis from other selectors', () => {
			const expected = {
				yAxis: selectors.highchartsYAxes(state),
				series: selectors.highchartsDataSeries(state),
			}
			expect(selectors.highchartsOptions(state)).to.deep.equal(expected)
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
})
