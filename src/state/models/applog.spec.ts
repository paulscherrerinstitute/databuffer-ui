import {
	applog,
	APPLOG_DEBUG,
	APPLOG_ERROR,
	APPLOG_INFO,
	APPLOG_WARNING,
	make_debug,
	make_error,
	make_info,
	make_warning,
	MAX_ENTRIES,
} from './applog'

describe('applog model', () => {
	describe('helper functions', () => {
		const MAX_JITTER = 100
		const MESSAGE = 'hello'

		it('make_debug', () => {
			const actual = make_debug(MESSAGE)
			expect(Date.now() - actual.ts).toBeLessThanOrEqual(MAX_JITTER)
			expect(actual.message).toBe(MESSAGE)
			expect(actual.severity).toBe(APPLOG_DEBUG)
		})
		it('make_info', () => {
			const actual = make_info(MESSAGE)
			expect(Date.now() - actual.ts).toBeLessThanOrEqual(MAX_JITTER)
			expect(actual.message).toBe(MESSAGE)
			expect(actual.severity).toBe(APPLOG_INFO)
		})
		it('make_warning', () => {
			const actual = make_warning(MESSAGE)
			expect(Date.now() - actual.ts).toBeLessThanOrEqual(MAX_JITTER)
			expect(actual.message).toBe(MESSAGE)
			expect(actual.severity).toBe(APPLOG_WARNING)
		})
		it('make_error', () => {
			const actual = make_error(MESSAGE)
			expect(Date.now() - actual.ts).toBeLessThanOrEqual(MAX_JITTER)
			expect(actual.message).toBe(MESSAGE)
			expect(actual.severity).toBe(APPLOG_ERROR)
		})
	})

	describe('applog initial state', () => {
		it('capacity', () => {
			expect(applog.state.capacity).toBe(1000)
		})
		it('entries', () => {
			expect(Array.isArray(applog.state.entries)).toBe(true)
			expect(applog.state.entries.length).toBe(0)
		})
		it('logThreshold', () => {
			expect(applog.state.logThreshold).toBe(APPLOG_WARNING)
		})
	})

	describe('applog reducers', () => {
		describe('setCapacity', () => {
			it('enforces minimum of 0', () => {
				const currentState = { ...applog.state }
				const nextState = applog.reducers.setCapacity(currentState, -10)
				expect(nextState.capacity).toBe(0)
			})
			it('enforces MAX_ENTRIES', () => {
				const currentState = { ...applog.state }
				const nextState = applog.reducers.setCapacity(
					currentState,
					MAX_ENTRIES + 1
				)
				expect(nextState.capacity).toBe(MAX_ENTRIES)
			})
			it('sets capacity for 0 <= x <= MAX_ENTRIES', () => {
				const currentState = { ...applog.state }
				const values = [
					0,
					1,
					2,
					Math.round(MAX_ENTRIES / 2),
					MAX_ENTRIES - 2,
					MAX_ENTRIES - 1,
					MAX_ENTRIES,
				]
				for (const x of values) {
					const nextState = applog.reducers.setCapacity(currentState, x)
					expect(nextState.capacity).toBe(x)
				}
			})
			it('deletes entries when new capacity < length', () => {
				const currentState = {
					...applog.state,
					entries: [
						make_info('a'),
						make_info('b'),
						make_info('c'),
						make_info('d'),
					],
				}
				const nextState = applog.reducers.setCapacity(currentState, 2)
				expect(nextState.entries.length).toBe(2)
				expect(nextState.entries[0].message).toBe('a')
				expect(nextState.entries[1].message).toBe('b')
			})
		})

		describe('logThreshold', () => {
			it('enforces minimum of 0', () => {
				const currentState = { ...applog.state }
				const nextState = applog.reducers.setThreshold(currentState, -10)
				expect(nextState.logThreshold).toBe(0)
			})
			it('sets logThreshold for 0 <= x', () => {
				const currentState = { ...applog.state }
				const values = [
					0,
					APPLOG_ERROR,
					APPLOG_WARNING,
					APPLOG_INFO,
					APPLOG_DEBUG,
				]
				for (const x of values) {
					const nextState = applog.reducers.setThreshold(currentState, x)
					expect(nextState.logThreshold).toBe(x)
				}
			})
		})

		describe('clear', () => {
			it('empties the log', () => {
				const currentState = {
					...applog.state,
					entries: [make_info('a'), make_info('b')],
				}
				const nextState = applog.reducers.clear(currentState)
				expect(nextState.entries.length).toBe(0)
			})
		})

		describe('log', () => {
			it('prepends to the log', () => {
				const currentState = {
					...applog.state,
					entries: [make_info('a'), make_info('b')],
				}
				const entry = make_error('oops')
				const nextState = applog.reducers.log(currentState, entry)
				expect(nextState.entries.length).toBe(3)
				expect(nextState.entries[0]).toEqual(entry)
			})
			it('limits entries.length to capacity', () => {
				const currentState = {
					...applog.state,
					capacity: 2,
					entries: [make_info('a'), make_info('b')],
				}
				const entry = make_error('oops')
				const nextState = applog.reducers.log(currentState, entry)
				expect(nextState.entries.length).toBe(2)
				expect(nextState.entries[0]).toEqual(entry)
				expect(nextState.entries[1].message).toBe('a')
			})
		})
	})
})
