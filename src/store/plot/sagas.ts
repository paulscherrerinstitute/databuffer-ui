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

function* drawPlotListener() {
	yield takeLatest(PlotActionTypes.DRAW_PLOT, drawPlotSaga)
}

function* drawPlotSaga() {
	const query = yield select(PlotSelectors.plotQuery)
	yield put(PlotActions.hideQueryRange())
	yield put(PlotActions.drawPlotRequest(Date.now()))
	try {
		const response = yield call(queryData, query)
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
	const query = yield select(PlotSelectors.downloadQuery)
	const response = yield call(queryDataRaw, query)

	response.blob().then(blob => {
		const ts = formatDate(Date.now())
		const fname = `export_${ts}_${aggregationSelection}.csv`
		FileSaver.saveAs(blob, fname)
	})
}
