/* eslint-disable @typescript-eslint/no-use-before-define */
import { AnyAction } from 'redux'
import { eventChannel, buffers } from 'redux-saga'
import createMatcher from '@captaincodeman/router'
import type { Routes } from '@captaincodeman/router'
import { RoutingActions } from './actions'

import { routes } from './routes'
import { takeEvery, call, take, put, cancelled } from 'redux-saga/effects'

export default [routeSaga, clickListener]

const sagaRouter = createMatcher(routes)

function* routeSaga() {
	yield takeEvery('ROUTER/LOCATION_CHANGE', navigationSaga)
}

const pathnamePrev = ''
function* navigationSaga(action: AnyAction) {
	const { pathname, queries } = action.payload

	if (pathname === pathnamePrev) return

	try {
		const route = sagaRouter(pathname)
		if (route !== null) {
			yield call(route.page, route.params, queries)
		}
	} catch (err) {
		// no route, ignore
	}
}

function* clickListener() {
	const channel = yield call(clickChannel)

	try {
		while (true) {
			const action = yield take(channel)
			yield put(action)
		}
	} finally {
		if (yield cancelled()) {
			channel.close()
		}
	}
}

function clickChannel() {
	return eventChannel(emit => {
		const handler = (e: MouseEvent) => {
			if (
				(e.button && e.button !== 0) ||
				e.metaKey ||
				e.altKey ||
				e.ctrlKey ||
				e.shiftKey ||
				e.defaultPrevented
			) {
				return
			}

			const anchor = e
				.composedPath()
				.filter(n => (n as HTMLElement).tagName === 'A')[0] as HTMLAnchorElement
			if (
				!anchor ||
				anchor.target ||
				anchor.hasAttribute('download') ||
				anchor.getAttribute('rel') === 'external'
			) {
				return
			}

			const href = anchor.href
			if (!href || href.indexOf('mailto:') !== -1) {
				return
			}

			const location = window.location
			const origin = location.origin || location.protocol + '//' + location.host
			if (href.indexOf(origin) !== 0) return

			e.preventDefault()
			if (href !== location.href) {
				emit(RoutingActions.push(anchor.href.substr(origin.length)))
			}
		}
		window.document.body.addEventListener('click', handler)
		return () => document.body.removeEventListener('click', handler)
	}, buffers.fixed(1))
}
