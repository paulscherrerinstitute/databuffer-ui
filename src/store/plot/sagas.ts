/* eslint-disable @typescript-eslint/no-use-before-define */
import { call, put, select, takeLatest } from 'redux-saga/effects'
import {
	DataQuery,
	EventField,
	AggregationType,
	AggregationOperation,
	DataResponseFormatType,
	AggregationSpecification,
} from '@psi/databuffer-query-js/query-data'

import FileSaver from 'file-saver'

import { PlotActionTypes, PlotActions } from './actions'
import * as PlotSelectors from './selectors'
import { queryRestApi } from '../../api/queryrest'
import { formatDate } from '../../util'

export default [drawPlotListener, downloadDataListener]

const NR_OF_BINS = 512

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
			nrOfBins: NR_OF_BINS,
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

async function queryDataRaw(options: DataQuery) {
	const response = await queryRestApi.queryDataRaw(options)

	return response
}

function* downloadDataListener() {
	yield takeLatest(PlotActionTypes.DOWNLOAD_DATA, downloadDataSaga)
}

function* downloadDataSaga() {
	const aggregationSelection = yield select(
		PlotSelectors.dialogDownloadAggregation
	)
	const channels: { name: string; backend: string }[] = yield select(
		PlotSelectors.channels
	)
	const start = yield select(PlotSelectors.startTime)
	const end = yield select(PlotSelectors.endTime)
	const aggregationOptions: AggregationSpecification = {
		aggregationType: AggregationType.VALUE,
		aggregations: [
			AggregationOperation.MAX,
			AggregationOperation.MEAN,
			AggregationOperation.MIN,
		],
	}
	const options: DataQuery = {
		channels,
		range: {
			startSeconds: start / 1000,
			endSeconds: end / 1000,
		},
		eventFields: [
			EventField.GLOBAL_DATE,
			EventField.PULSE_ID,
			EventField.VALUE,
			EventField.EVENT_COUNT,
		],
		response: {
			format: DataResponseFormatType.CSV,
		},
	}
	if (aggregationSelection === 'raw') {
		// do nothing
	} else if (aggregationSelection === 'as-is') {
		options.aggregation = { ...aggregationOptions, nrOfBins: NR_OF_BINS }
	} else {
		options.aggregation = {
			...aggregationOptions,
			durationPerBin: aggregationSelection,
		}
	}
	const response = yield call(queryDataRaw, options)

	response.blob().then(blob => {
		const ts = formatDate(Date.now())
		const fname = `export_${ts}_${aggregationSelection}.csv`
		FileSaver.saveAs(blob, fname)
	})
}
