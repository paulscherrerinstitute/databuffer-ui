/* eslint-disable @typescript-eslint/no-use-before-define */
import { call, put, select, takeLatest } from 'redux-saga/effects'
import {
	DataQuery,
	EventField,
	AggregationType,
	AggregationOperation,
} from '@psi/databuffer-query-js/query-data'

import { PlotActionTypes, PlotActions } from './actions'
import * as PlotSelectors from './selectors'
import { queryRestApi } from '../../api/queryrest'

export default [drawPlotListener]

function* drawPlotListener() {
	yield takeLatest(PlotActionTypes.DRAW_PLOT, drawPlotSaga)
}

function* drawPlotSaga() {
	const channels = yield select(PlotSelectors.channels)
	const start = yield select(PlotSelectors.startTime)
	const end = yield select(PlotSelectors.endTime)

	const options: DataQuery = {
		channels,
		range: {
			startSeconds: start / 1000,
			endSeconds: end / 1000,
		},
		eventFields: [
			EventField.GLOBAL_MILLIS,
			EventField.PULSE_ID,
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
			nrOfBins: 512,
		},
	}

	yield put(PlotActions.hideQueryRange())
	yield put(PlotActions.drawPlotRequest(Date.now()))
	try {
		const response = yield call(queryData, options)
		yield put(PlotActions.drawPlotSuccess(Date.now(), response))
	} catch (err) {
		yield put(PlotActions.drawPlotFailure(Date.now(), err))
	}
}

async function queryData(options: DataQuery) {
	const response = await queryRestApi.queryData(options)

	return response
}
