import { describe, it } from 'mocha'
import { expect } from 'chai'
import { plotPreselectRoute } from './routes'
import { put, PutEffect } from 'redux-saga/effects'
import { PlotActions, Channel, PlotActionTypes } from '../plot'
import { channelToId } from '@psi/databuffer-query-js/channel'
import { RoutingActions } from './actions'
import { parseISO } from 'date-fns'

describe('routing routes sagas', () => {
	describe('plotPreselectRoute', () => {
		// save some typing (pun intended)
		//
		// for checking startTime and endTime on the DRAW_PLOT action's payload
		// it is important not to compare for equality, but rather check for
		// proximity (using .closeto).
		// Otherwise the tests may be brittle, i.e. they may fail sometimes because
		// of tiny differences in what `Date.now()` returns.
		type DrawPlotEffect = PutEffect<ReturnType<typeof PlotActions.drawPlot>>

		it('does the right steps with the right defaults', () => {
			const gen = plotPreselectRoute(null, {})
			expect(gen.next().value).to.deep.equal(
				put(PlotActions.setSelectedChannels([]))
			)

			// step 2: draw plot
			const step2 = gen.next().value as DrawPlotEffect
			expect(step2.payload.action.payload.endTime).to.be.closeTo(
				Date.now(),
				100
			)
			expect(step2.payload.action.payload.startTime).to.be.closeTo(
				Date.now() - 12 * 60 * 60 * 1000,
				100
			)
			// step 3: set new route
			expect(gen.next().value).to.deep.equal(
				put(RoutingActions.replace('/plot'))
			)
			// step 4: none. we must be done.
			expect(gen.next().done).to.be.true
		})

		it('takes channels from parameters c1...c16', () => {
			const expectedChannels: Channel[] = [
				{ backend: 'be16', name: 'ch01' },
				{ backend: 'be15', name: 'ch02' },
				{ backend: 'be14', name: 'ch03' },
				{ backend: 'be13', name: 'ch04' },
				{ backend: 'be12', name: 'ch05' },
				{ backend: 'be11', name: 'ch06' },
				{ backend: 'be10', name: 'ch07' },
				{ backend: 'be09', name: 'ch08' },
				{ backend: 'be08', name: 'ch09' },
				{ backend: 'be07', name: 'ch10' },
				{ backend: 'be06', name: 'ch11' },
				{ backend: 'be05', name: 'ch12' },
				{ backend: 'be04', name: 'ch13' },
				{ backend: 'be03', name: 'ch14' },
				{ backend: 'be02', name: 'ch15' },
				{ backend: 'be01', name: 'ch16' },
			]
			const queryParams = {}
			for (let i = 0; i < expectedChannels.length; i++) {
				queryParams[`c${i + 1}`] = channelToId(expectedChannels[i])
			}
			const gen = plotPreselectRoute(null, queryParams)
			expect(gen.next().value).to.deep.equal(
				put(PlotActions.setSelectedChannels(expectedChannels))
			)
		})

		it('allows gaps in parameters c1...c16', () => {
			const expectedChannels: Channel[] = [
				{ backend: 'be01', name: 'ch01' },
				{ backend: 'be02', name: 'ch02' },
				{ backend: 'be03', name: 'ch03' },
			]
			const queryParams = {
				c4: 'be01/ch01',
				c9: 'be02/ch02',
				c13: 'be03/ch03',
			}
			const gen = plotPreselectRoute(null, queryParams)
			expect(gen.next().value).to.deep.equal(
				put(PlotActions.setSelectedChannels(expectedChannels))
			)
		})

		it('ignores parameters c0, and c17+', () => {
			const expectedChannels: Channel[] = [
				{ backend: 'be01', name: 'ch01' },
				{ backend: 'be02', name: 'ch02' },
			]
			const queryParams = {
				c0: 'be00/ch00', // should be ignored
				c1: 'be01/ch01', // should be included
				c16: 'be02/ch02', // should be included
				c17: 'be03/ch03', // should be ignored
				c18: 'be04/ch04', // should be ignored
				c19: 'be05/ch05', // should be ignored
			}
			const gen = plotPreselectRoute(null, queryParams)
			expect(gen.next().value).to.deep.equal(
				put(PlotActions.setSelectedChannels(expectedChannels))
			)
		})

		it('reads parameter startTime and endTime as ISO strings', () => {
			const queryParams = {
				startTime: '2020-05-04T11:07:45.123+02:00',
				endTime: '2020-05-04T12:07:45.234+02:00',
			}
			const expectedStartTime = parseISO(queryParams.startTime).getTime()
			const expectedEndTime = parseISO(queryParams.endTime).getTime()
			const gen = plotPreselectRoute(null, queryParams)
			gen.next().value // skip step1
			const effect = gen.next().value as DrawPlotEffect
			expect(effect.payload.action.payload.startTime).to.be.closeTo(
				expectedStartTime,
				100
			)
			expect(effect.payload.action.payload.endTime).to.be.closeTo(
				expectedEndTime,
				100
			)
		})

		it('reads parameter startTime and endTime as milliseconds', () => {
			const queryParams = {
				startTime: 100000,
				endTime: 200000,
			}
			const expectedStartTime = 100000
			const expectedEndTime = 200000
			const gen = plotPreselectRoute(null, queryParams)
			gen.next().value // skip step1
			const effect = gen.next().value as DrawPlotEffect
			expect(effect.payload.action.payload.startTime).to.be.closeTo(
				expectedStartTime,
				100
			)
			expect(effect.payload.action.payload.endTime).to.be.closeTo(
				expectedEndTime,
				100
			)
		})

		it('sets start and end time from parameter duration', () => {
			const duration = 60000 // 1 minute
			const queryParams = {
				duration,
			}
			const expectedEndTime = Date.now()
			const expectedStartTime = expectedEndTime - duration
			const gen = plotPreselectRoute(null, queryParams)
			gen.next().value // skip step1
			const effect = gen.next().value as DrawPlotEffect
			expect(effect.payload.action.payload.startTime).to.be.closeTo(
				expectedStartTime,
				100
			)
			expect(effect.payload.action.payload.endTime).to.be.closeTo(
				expectedEndTime,
				100
			)
		})

		it('startTime has precedence over duration', () => {
			const queryParams = {
				duration: 60000,
				startTime: 100000,
			}
			const expectedStartTime = 100000
			const gen = plotPreselectRoute(null, queryParams)
			gen.next().value // skip step1
			const effect = gen.next().value as DrawPlotEffect
			expect(effect.payload.action.payload.startTime).to.be.closeTo(
				expectedStartTime,
				100
			)
		})

		it('endTime has precedence over duration', () => {
			const queryParams = {
				duration: 60000,
				endTime: 200000,
			}
			const expectedEndTime = 200000 // not Date.now()
			const gen = plotPreselectRoute(null, queryParams)
			gen.next().value // skip step1
			const effect = gen.next().value as DrawPlotEffect
			expect(effect.payload.action.payload.endTime).to.be.closeTo(
				expectedEndTime,
				100
			)
		})
	})
})
