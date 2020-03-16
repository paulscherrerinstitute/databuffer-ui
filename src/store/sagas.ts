import createSagaMiddleware from 'redux-saga'
import { all, spawn, call } from 'redux-saga/effects'

import channelSearch from './channelsearch/sagas'
import plot from './plot/sagas'
import route from './routing/sagas'

export const rootSagas = {
	channelSearch,
	plot,
	route,
}

export const sagaMiddleware = createSagaMiddleware()

export async function startSagas() {
	for (const name in rootSagas) {
		console.log('root saga', name)
		const sagas = rootSagas[name]

		// eslint-disable-next-line no-inner-declarations
		function* saga() {
			yield all(
				sagas.map(saga =>
					spawn(function*() {
						while (true) {
							try {
								yield call(saga)
								break
							} catch (err) {
								console.error(err)
							}
						}
					})
				)
			)
		}

		sagaMiddleware.run(saga)
	}
}
