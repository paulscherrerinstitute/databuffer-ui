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
