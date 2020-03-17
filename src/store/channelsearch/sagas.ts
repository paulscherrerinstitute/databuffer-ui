/* eslint-disable @typescript-eslint/no-use-before-define */
import { call, put, select, takeLatest } from 'redux-saga/effects'
import { ChannelTypes, ChannelSearchActions } from './actions'
import * as ChannelSearchSelectors from './selectors'
import { channelToId } from '@psi/databuffer-query-js/channel'

import { queryRestApi } from '../../api/queryrest'
import { QueryOptions } from '@psi/databuffer-query-js/query-channel-names'

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

	const options: QueryOptions = {
		regex: pattern,
		// backends,
	}

	yield put(ChannelSearchActions.searchChannelRequest(pattern))
	try {
		const { ids, entities } = yield call(searchChannel, options)
		yield put(ChannelSearchActions.searchChannelSuccess(ids, entities))
	} catch (err) {
		console.error(err)
		yield put(ChannelSearchActions.searchChannelFailure(err))
	}
}

export async function searchChannel(options: QueryOptions) {
	const response = await queryRestApi.queryChannelNames(options)

	const result = { ids: [], entities: {} }

	for (const x of response) {
		for (const name of x.channels) {
			const ch = { backend: x.backend, name }
			const id = channelToId(ch)
			result.ids.push(id)
			result.entities[id] = ch
		}
	}

	return result
}
