import { PlotActions, PlotActionTypes } from './actions'
import type { DataResponse } from '../../api/queryrest'
import { YAxis, DataSeries, Channel } from './models'
import { channelToId } from '@psi/databuffer-query-js/channel'

export interface PlotState {
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
}

export const initialState: PlotState = {
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
				})),
				dataSeries: action.payload.channels.map((ch, idx) => ({
					name: ch.name,
					channelIndex: idx,
					yAxisIndex: idx,
				})),
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

		default:
			return state
	}
}
