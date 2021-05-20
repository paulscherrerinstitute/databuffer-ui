import * as datefns from 'date-fns'

/**
 * Format a timestamp in local time in an ISO8601 style format.
 *
 * @param ts the timestamp to be formatted (milliseconds since)
 */
export function formatDate(ts: number, separator: string = ' ') {
	const zeroPad2 = (n: number) => (n < 10 ? '0' + n : n)
	const zeroPad3 = (n: number) => (n < 10 ? '00' + n : n < 100 ? '0' + n : n)
	const date = new Date(ts)
	const y = date.getFullYear()
	const m = zeroPad2(date.getMonth() + 1)
	const d = zeroPad2(date.getDate())
	const H = zeroPad2(date.getHours())
	const M = zeroPad2(date.getMinutes())
	const S = zeroPad2(date.getSeconds())
	const SSS = zeroPad3(date.getMilliseconds())
	return `${y}-${m}-${d}${separator}${H}:${M}:${S}.${SSS}`
}

/**
 * Return a shallow copy of an array, omitting the element at index.
 *
 * @param arr the array to be copied
 *
 * @param index the index to be not included in the copy.
 * Negative indices count from the end (i.e. index -1 == last item)
 */
export function omitFromArray<T>(arr: T[], index: number) {
	if (index < 0) index = index + arr.length
	return [...arr.slice(0, index), ...arr.slice(index + 1)]
}

/**
 * Check, if an object is empty, i.e. contains any keys.
 *
 * @param obj the object to check
 */
export function isEmptyObj(obj: Record<string, unknown>) {
	// implementation kudos to https://stackoverflow.com/a/59787784/4320236
	for (const _ in obj) return false
	return true
}

/**
 * A time range using JS timestamps (milliesconds since 1970-01-01 00:00 UTC)
 */
export interface TimeRange {
	start: number
	end: number
}

/**
 * Return the TimeRange from 00:00:00.000 - 23:59:59.999 for a given baseDate
 *
 * @param baseDate msec timestamp for reference
 * @returns TimeRange object with `start` and `end` timestamps
 */
export function timeRangeDay(baseDate: number): TimeRange {
	const d = new Date(baseDate)
	const start = d.setHours(0, 0, 0, 0)
	const end = d.setHours(23, 59, 59, 999)
	return { start, end }
}

/**
 * Return the TimeRange from first-of-month@00:00:00.000 - last-of-month@23:59:59.999 for a given baseDate
 *
 * @param baseDate msec timestamp for reference
 * @returns TimeRange object with `start` and `end` timestamps
 */
export function timeRangeMonth(baseDate: number): TimeRange {
	const start = datefns.setDate(baseDate, 1).setHours(0, 0, 0, 0)
	const end = datefns.lastDayOfMonth(baseDate).setHours(23, 59, 59, 999)
	return { start, end }
}

/**
 * Return the TimeRange from Monday@00:00:00.000 - Sunday@23:59:59.999 for a given baseDate
 *
 * @param baseDate msec timestamp for reference
 * @returns TimeRange object with `start` and `end` timestamps
 */
export function timeRangeWeek(baseDate: number): TimeRange {
	const start = datefns
		.setDay(baseDate, 1, { weekStartsOn: 1 })
		.setHours(0, 0, 0, 0)
	const end = datefns
		.lastDayOfWeek(baseDate, { weekStartsOn: 1 })
		.setHours(23, 59, 59, 999)
	return { start, end }
}
