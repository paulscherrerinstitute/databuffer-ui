import { PlotActions, PlotActionTypes } from './actions'
import type { DataResponse } from '../../api/queryrest'
import { YAxis, DataSeries, Channel } from './models'
import { channelToId } from '@psi/databuffer-query-js/channel'

export interface PlotState {
	plotTitle: string
	startTime: number
	endTime: number
	startPulse: number
	endPulse: number
	queryMode: 'time' | 'pulse'
	channels: { backend: string; name: string }[]
	fetching: boolean
	error: Error
	request: {
		sentAt: number
		finishedAt: number
	}
	response: DataResponse
	yAxes: YAxis[]
	dataSeries: DataSeries[]
	queryRangeShowing: boolean
	dialogShareLinkShowing: boolean
	dialogShareLinkAbsoluteTimes: boolean
}

export const initialState: PlotState = {
	plotTitle: '',
	startTime: Date.now() - 1000,
	endTime: Date.now(),
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
	dialogShareLinkShowing: false,
	dialogShareLinkAbsoluteTimes: true,
}

const findIndexOfChannel = (state: PlotState, ch: Channel): number =>
	state.channels.findIndex(e => e.backend === ch.backend && e.name === ch.name)

const isChannelSelected = (state: PlotState, ch: Channel): boolean =>
	findIndexOfChannel(state, ch) >= 0

export default (
	state: PlotState = initialState,
	action: PlotActions
): PlotState => {
	switch (action.type) {
		case PlotActionTypes.SELECT_CHANNEL:
			return isChannelSelected(state, action.payload.channel)
				? state
				: {
						...state,
						channels: [...state.channels, action.payload.channel],
						yAxes: [
							...state.yAxes,
							{
								title: action.payload.channel.name,
								unit: '',
								side: state.yAxes.length % 2 === 0 ? 'left' : 'right',
								scale: {
									auto: true,
									min: 0,
									max: 0,
								},
							},
						],
						dataSeries: [
							...state.dataSeries,
							{
								channelIndex: state.channels.length,
								yAxisIndex: state.yAxes.length,
								name: action.payload.channel.name,
							},
						],
				  }

		case PlotActionTypes.UNSELECT_CHANNEL:
			return {
				...state,
				channels: [
					...state.channels.slice(0, action.payload.index),
					...state.channels.slice(action.payload.index + 1),
				],
				yAxes: state.yAxes
					.filter((x, idx) => idx !== action.payload.index)
					.map((x, idx) => ({ ...x, side: idx % 2 === 0 ? 'left' : 'right' })),
				dataSeries: state.dataSeries
					.filter((x, idx) => idx !== action.payload.index)
					.map((
						x // shift the indices for all items after the unselected item
					) =>
						x.channelIndex < action.payload.index
							? x
							: {
									...x,
									channelIndex: x.channelIndex - 1,
									yAxisIndex: x.yAxisIndex - 1,
							  }
					),
			}

		case PlotActionTypes.SET_SELECTED_CHANNELS:
			return {
				...state,
				channels: action.payload.channels,
				yAxes: action.payload.channels.map((ch, idx) => ({
					title: ch.name,
					side: idx % 2 === 0 ? 'left' : 'right',
					unit: '',
					scale: {
						auto: true,
						min: 0,
						max: 0,
					},
				})),
				dataSeries: action.payload.channels.map((ch, idx) => ({
					name: ch.name,
					channelIndex: idx,
					yAxisIndex: idx,
				})),
			}

		case PlotActionTypes.PLOT_TITLE_CHANGE:
			return {
				...state,
				plotTitle: action.payload.plotTitle,
			}

		case PlotActionTypes.DATA_SERIES_LABEL_CHANGE:
			return {
				...state,
				dataSeries: state.dataSeries.map((series, idx) =>
					idx !== action.payload.index
						? series
						: { ...series, name: action.payload.label }
				),
				yAxes: state.yAxes.map((axis, idx) =>
					idx !== action.payload.index
						? axis
						: { ...axis, title: action.payload.label }
				),
			}

		case PlotActionTypes.START_TIME_CHANGE:
			return {
				...state,
				startTime: action.payload.startTime,
			}

		case PlotActionTypes.END_TIME_CHANGE:
			return {
				...state,
				endTime: action.payload.endTime,
			}

		case PlotActionTypes.DRAW_PLOT_REQUEST:
			return {
				...state,
				fetching: true,
				error: null,
				request: {
					sentAt: action.payload.timestamp,
					finishedAt: undefined,
				},
				response: [],
			}

		case PlotActionTypes.DRAW_PLOT_SUCCESS:
			return {
				...state,
				fetching: false,
				request: {
					...state.request,
					finishedAt: action.payload.timestamp,
				},
				response: action.payload.response,
			}

		case PlotActionTypes.DRAW_PLOT_FAILURE:
			return {
				...state,
				fetching: false,
				request: {
					...state.request,
					finishedAt: action.payload.timestamp,
				},
				error: action.payload.error,
			}

		case PlotActionTypes.TOGGLE_QUERY_RANGE:
			return {
				...state,
				queryRangeShowing: !state.queryRangeShowing,
			}

		case PlotActionTypes.HIDE_QUERY_RANGE:
			return {
				...state,
				queryRangeShowing: false,
			}

		case PlotActionTypes.SHOW_QUERY_RANGE:
			return {
				...state,
				queryRangeShowing: true,
			}

		case PlotActionTypes.SHOW_SHARE_LINK:
			return {
				...state,
				dialogShareLinkShowing: true,
			}

		case PlotActionTypes.HIDE_SHARE_LINK:
			return {
				...state,
				dialogShareLinkShowing: false,
			}

		case PlotActionTypes.SHARE_ABSOLUTE_TIMES:
			return {
				...state,
				dialogShareLinkAbsoluteTimes: true,
			}

		case PlotActionTypes.SHARE_RELATIVE_TIME:
			return {
				...state,
				dialogShareLinkAbsoluteTimes: false,
			}

		case PlotActionTypes.SET_AXIS_SCALE:
			return {
				...state,
				yAxes: state.yAxes.map((axis, index) =>
					index !== action.payload.index
						? axis
						: { ...axis, scale: action.payload.scale }
				),
			}

		default:
			return state
	}
}
