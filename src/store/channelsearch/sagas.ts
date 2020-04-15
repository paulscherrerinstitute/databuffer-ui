/* eslint-disable @typescript-eslint/no-use-before-define */
import { call, put, select, takeLatest } from 'redux-saga/effects'
import { ChannelTypes, ChannelSearchActions } from './actions'
import * as ChannelSearchSelectors from './selectors'
import { channelToId } from '@psi/databuffer-query-js/channel'

import { queryRestApi } from '../../api/queryrest'
import type { ChannelConfigsQuery } from '@psi/databuffer-query-js'

export default [searchChannelListener]

function* searchChannelListener() {
	yield takeLatest(ChannelTypes.CHANNEL_SEARCH, channelSearchSaga)
}

function* channelSearchSaga(
	action: ReturnType<typeof ChannelSearchActions.searchChannel>
) {
	const { pattern } = action.payload
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const backends = yield select(ChannelSearchSelectors.selectedBackends)

	const query: ChannelConfigsQuery = {
		regex: pattern,
		// backends,
	}

	yield put(ChannelSearchActions.searchChannelRequest(pattern))
	try {
		const { ids, entities } = yield call(searchChannel, query)
		yield put(ChannelSearchActions.searchChannelSuccess(ids, entities))
	} catch (err) {
		console.error(err)
		yield put(ChannelSearchActions.searchChannelFailure(err))
	}
}

export async function searchChannel(query: ChannelConfigsQuery) {
	const response = await queryRestApi.queryChannelConfigs(query)

	const result = { ids: [], entities: {} }

	for (const x of response) {
		for (const chConfig of x.channels) {
			const { backend, name } = chConfig
			const id = channelToId({ backend, name })
			result.ids.push(id)
			result.entities[id] = chConfig
		}
	}

	return result
}
