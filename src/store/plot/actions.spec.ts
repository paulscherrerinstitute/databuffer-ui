import { describe, it } from 'mocha'
import { expect } from 'chai'

import { PlotActions, PlotActionTypes } from './actions'
import type { DataResponse } from '../../api/queryrest'

const EXAMPLE_LIST_OF_CHANNELS = [
	{ name: 'ch1', backend: 'b1' },
	{ name: 'ch2', backend: 'b2' },
	{ name: 'ch3', backend: 'b3' },
]
const EXAMPLE_CHANNEL_DATA_RESPONSE: DataResponse = [
	{
		channel: { name: 'ch1', backend: 'b1' },
		data: [],
	},
]

describe('PlotActions', () => {
	it('should create SELECT_CHANNEL', () => {
		const action = PlotActions.selectChannel(EXAMPLE_LIST_OF_CHANNELS[0])
		const expected = {
			type: PlotActionTypes.SELECT_CHANNEL,
			payload: {
				channel: EXAMPLE_LIST_OF_CHANNELS[0],
			},
		}
		expect(action).to.deep.equal(expected)
	})

	it('should create UNSELECT_CHANNEL', () => {
		const action = PlotActions.unselectChannel(42)
		const expected = {
			type: PlotActionTypes.UNSELECT_CHANNEL,
			payload: {
				index: 42,
			},
		}
		expect(action).to.deep.equal(expected)
	})

	it('should create SET_SELECTED_CHANNELS', () => {
		const action = PlotActions.setSelectedChannels(EXAMPLE_LIST_OF_CHANNELS)
		const expected = {
			type: PlotActionTypes.SET_SELECTED_CHANNELS,
			payload: {
				channels: EXAMPLE_LIST_OF_CHANNELS,
			},
		}
		expect(action).to.deep.equal(expected)
	})

	it('should create PLOT_TITLE_CHANGE', () => {
		const action = PlotActions.plotTitleChange('Hello')
		const expected = {
			type: PlotActionTypes.PLOT_TITLE_CHANGE,
			payload: {
				plotTitle: 'Hello',
			},
		}
		expect(action).to.deep.equal(expected)
	})

	it('should create DATA_SERIES_LABEL_CHANGE', () => {
		const action = PlotActions.dataSeriesLabelChange(5, 'Hello')
		const expected = {
			type: PlotActionTypes.DATA_SERIES_LABEL_CHANGE,
			payload: {
				index: 5,
				label: 'Hello',
			},
		}
		expect(action).to.deep.equal(expected)
	})

	it('should create START_TIME_CHANGE', () => {
		const action = PlotActions.startTimeChange(12345)
		const expected = {
			type: PlotActionTypes.START_TIME_CHANGE,
			payload: {
				startTime: 12345,
			},
		}
		expect(action).to.deep.equal(expected)
	})

	it('should create END_TIME_CHANGE', () => {
		const action = PlotActions.endTimeChange(12345)
		const expected = {
			type: PlotActionTypes.END_TIME_CHANGE,
			payload: {
				endTime: 12345,
			},
		}
		expect(action).to.deep.equal(expected)
	})

	it('should create DRAW_PLOT', () => {
		const action = PlotActions.drawPlot()
		const expected = {
			type: PlotActionTypes.DRAW_PLOT,
		}
		expect(action).to.deep.equal(expected)
	})

	it('should create DRAW_PLOT_REQUEST', () => {
		const action = PlotActions.drawPlotRequest(300)
		const expected = {
			type: PlotActionTypes.DRAW_PLOT_REQUEST,
			payload: {
				timestamp: 300,
			},
		}
		expect(action).to.deep.equal(expected)
	})

	it('should create DRAW_PLOT_FAILURE', () => {
		const action = PlotActions.drawPlotFailure(300, new Error('example error'))
		const expected = {
			type: PlotActionTypes.DRAW_PLOT_FAILURE,
			payload: {
				timestamp: 300,
				error: new Error('example error'),
			},
		}
		expect(action.type).to.equal(expected.type)
		expect(action.payload.timestamp).to.equal(expected.payload.timestamp)
		expect(action.payload.error).to.be.instanceOf(Error)
		expect(action.payload.error.message).to.equal(
			expected.payload.error.message
		)
	})

	it('should create DRAW_PLOT_SUCCESS', () => {
		const action = PlotActions.drawPlotSuccess(
			400,
			EXAMPLE_CHANNEL_DATA_RESPONSE
		)
		const expected = {
			type: PlotActionTypes.DRAW_PLOT_SUCCESS,
			payload: {
				timestamp: 400,
				response: EXAMPLE_CHANNEL_DATA_RESPONSE,
			},
		}
		expect(action).to.deep.equal(expected)
	})

	it('should create TOGGLE_QUERY_RANGE', () => {
		const action = PlotActions.toggleQueryRange()
		const expected = {
			type: PlotActionTypes.TOGGLE_QUERY_RANGE,
		}
		expect(action).to.deep.equal(expected)
	})

	it('should create SHOW_QUERY_RANGE', () => {
		const action = PlotActions.showQueryRange()
		const expected = {
			type: PlotActionTypes.SHOW_QUERY_RANGE,
		}
		expect(action).to.deep.equal(expected)
	})

	it('should create HIDE_QUERY_RANGE', () => {
		const action = PlotActions.hideQueryRange()
		const expected = {
			type: PlotActionTypes.HIDE_QUERY_RANGE,
		}
		expect(action).to.deep.equal(expected)
	})

	it('should create SHOW_SHARE_LINK', () => {
		const action = PlotActions.showShareLink()
		const expected = {
			type: PlotActionTypes.SHOW_SHARE_LINK,
		}
		expect(action).to.deep.equal(expected)
	})

	it('should create HIDE_SHARE_LINK', () => {
		const action = PlotActions.hideShareLink()
		const expected = {
			type: PlotActionTypes.HIDE_SHARE_LINK,
		}
		expect(action).to.deep.equal(expected)
	})

	it('should create SHARE_ABSOLUTE_TIMES', () => {
		const action = PlotActions.shareAbsoluteTimes()
		const expected = {
			type: PlotActionTypes.SHARE_ABSOLUTE_TIMES,
		}
		expect(action).to.deep.equal(expected)
	})

	it('should create SHARE_RELATIVE_TIME', () => {
		const action = PlotActions.shareRelativeTime()
		const expected = {
			type: PlotActionTypes.SHARE_RELATIVE_TIME,
		}
		expect(action).to.deep.equal(expected)
	})

	it('should create SET_AXIS_MIN', () => {
		const action = PlotActions.setAxisMin(3, 20)
		const expected = {
			type: PlotActionTypes.SET_AXIS_MIN,
			payload: {
				index: 3,
				min: 20,
			},
		}
		expect(action).to.deep.equal(expected)
	})

	it('should create SET_AXIS_MAX', () => {
		const action = PlotActions.setAxisMax(3, 20)
		const expected = {
			type: PlotActionTypes.SET_AXIS_MAX,
			payload: {
				index: 3,
				max: 20,
			},
		}
		expect(action).to.deep.equal(expected)
	})
})
