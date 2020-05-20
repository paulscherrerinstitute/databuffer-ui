import { createAction, ActionsUnion } from '../actions'
import { Channel } from './models'
import type { DataResponse } from '../../api/queryrest'

export enum PlotActionTypes {
	SELECT_CHANNEL = 'daq-web-ui-app/SELECT_CHANNEL',
	UNSELECT_CHANNEL = 'daq-web-ui-app/UNSELECT_CHANNEL',
	SET_SELECTED_CHANNELS = 'daq-web-ui-app/SET_SELECTED_CHANNELS',

	START_TIME_CHANGE = 'daq-web-ui-app/START_TIME_CHANGE',
	END_TIME_CHANGE = 'daq-web-ui-app/END_TIME_CHANGE',

	DRAW_PLOT = 'daq-web-ui-app/DRAW_PLOT',
	DRAW_PLOT_REQUEST = 'daq-web-ui-app/DRAW_PLOT_REQUEST',
	DRAW_PLOT_SUCCESS = 'daq-web-ui-app/DRAW_PLOT_SUCCESS',
	DRAW_PLOT_FAILURE = 'daq-web-ui-app/DRAW_PLOT_FAILURE',

	TOGGLE_QUERY_RANGE = 'daq-web-ui-app/PLOT/TOGGLE_QUERY_RANGE',
	SHOW_QUERY_RANGE = 'daq-web-ui-app/PLOT/SHOW_QUERY_RANGE',
	HIDE_QUERY_RANGE = 'daq-web-ui-app/PLOT/HIDE_QUERY_RANGE',
}

export const PlotActions = {
	selectChannel: (channel: Channel) =>
		createAction(PlotActionTypes.SELECT_CHANNEL, { channel }),
	unselectChannel: (index: number) =>
		createAction(PlotActionTypes.UNSELECT_CHANNEL, { index }),
	setSelectedChannels: (channels: Channel[]) =>
		createAction(PlotActionTypes.SET_SELECTED_CHANNELS, { channels }),

	startTimeChange: (startTime: number) =>
		createAction(PlotActionTypes.START_TIME_CHANGE, { startTime }),
	endTimeChange: (endTime: number) =>
		createAction(PlotActionTypes.END_TIME_CHANGE, { endTime }),

	drawPlot: () => createAction(PlotActionTypes.DRAW_PLOT),
	drawPlotRequest: (timestamp: number) =>
		createAction(PlotActionTypes.DRAW_PLOT_REQUEST, { timestamp }),
	drawPlotSuccess: (timestamp: number, response: DataResponse) =>
		createAction(PlotActionTypes.DRAW_PLOT_SUCCESS, {
			timestamp,
			response,
		}),
	drawPlotFailure: (timestamp: number, error: Error) =>
		createAction(PlotActionTypes.DRAW_PLOT_FAILURE, { timestamp, error }),

	toggleQueryRange: () => createAction(PlotActionTypes.TOGGLE_QUERY_RANGE),
	showQueryRange: () => createAction(PlotActionTypes.SHOW_QUERY_RANGE),
	hideQueryRange: () => createAction(PlotActionTypes.HIDE_QUERY_RANGE),
}

export type PlotActions = ActionsUnion<typeof PlotActions>
