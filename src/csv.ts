import { formatDate } from './util'
import { DataSeries } from './store/plot'
import { DataResponse } from './api/queryrest'
import { AggregationResult } from '@psi/databuffer-query-js/query-data'

export interface CsvDataPoint {
	time: number
	binSize: number
	min: number
	mean: number
	max: number
}
export interface CsvDataSeries {
	name: string
	values: CsvDataPoint[]
}

export interface CsvOptions {
	fieldSeparator: string
	fieldQuote: string
	rowSeparator: string
}

export const DEFAULT_OPTIONS: CsvOptions = {
	fieldSeparator: ',',
	fieldQuote: '"',
	rowSeparator: '\n',
}

export const generateCsv = (
	data: CsvDataSeries[],
	csvOptions = DEFAULT_OPTIONS
): string => {
	const rows: string[][] = []
	// target layout:
	//
	// |      | channel 1 |     |      |     | channel 2 |     |      |     | channel 3 | ... |
	// | time | events    | min | mean | max | events    | min | mean | max | events    | ... |
	// | ---- | --------- | --- | ---- | --- | --------- | --- | ---- | --- | --------- | ... |
	// | ... data ...

	// add header to rows
	const firstRow = ['']
	const secondRow = ['time']
	data.forEach(x => {
		firstRow.push(...[x.name, '', '', ''])
		secondRow.push(...['events', 'min', 'mean', 'max'])
	})
	rows.push(firstRow)
	rows.push(secondRow)

	// add data to rows
	//
	// algorithm outline:
	// ------------------
	// initialize data series indices  // index "null" == no more data points
	// t := find smallest timestamp of next datapoints
	// while t !== null:
	//     add timestamp t to row
	//     for all data series:
	//         if has no more datapoints:
	//             add empty datapoint to row
	//             continue with next series
	//         if datapoint.time > t:
	//             add empty datapoint to row
	//             continue with next series
	//         if t === datapoint.time:
	//             add datapoint to row
	//						 advance data series index
	//     add row to rows
	//     t := find smallest timestamp of next datapoints
	const EMPTY_DATA_POINT = ['', '', '', '']

	const indices = data.map(series => (series.values.length > 0 ? 0 : null))
	const findNextTimestamp = (): number | null => {
		let t: number = null
		for (let i = 0; i < data.length; i++) {
			if (indices[i] === null) continue
			const seriesTime = data[i].values[indices[i]].time
			if (t === null || t > seriesTime) {
				t = seriesTime
			}
		}
		return t
	}
	let t = findNextTimestamp()
	while (t !== null) {
		const row = [formatDate(t)]
		for (let i = 0; i < data.length; i++) {
			if (indices[i] === null) {
				// series has no more data
				row.push(...EMPTY_DATA_POINT)
				continue
			}
			const point = data[i].values[indices[i]]
			if (point.time < t) {
				throw new Error(
					`INTERNAL ERROR! Values are not ordered in series ${data[i].name} (series index ${i}, point index ${indices[i]})`
				)
			}
			if (point.time > t) {
				// next point is in the future
				row.push(...EMPTY_DATA_POINT)
				continue
			}
			// point.time === t
			row.push(
				point.binSize.toString(),
				point.min.toString(),
				point.mean.toString(),
				point.max.toString()
			)
			indices[i]++
			if (indices[i] >= data[i].values.length) indices[i] = null
		}
		rows.push(row)
		t = findNextTimestamp()
	}

	// transform rows to CSV
	return rows
		.map(row =>
			row
				.map(
					field => `${csvOptions.fieldQuote}${field}${csvOptions.fieldQuote}`
				)
				.join(csvOptions.fieldSeparator)
		)
		.join(csvOptions.rowSeparator)
}

export const extractCsvDataFromQueryResponse = (
	dataSeries: DataSeries[],
	channels: { name: string; backend: string }[],
	response: DataResponse
): CsvDataSeries[] =>
	dataSeries.map(ds => {
		const ch = channels[ds.channelIndex]
		const responseItem = response.find(
			item =>
				item.channel.backend === ch.backend && item.channel.name === ch.name
		)
		if (responseItem === undefined)
			return {
				name: ds.name,
				values: [],
			}
		const values = responseItem.data.map(x => ({
			time: x.globalMillis,
			binSize: x.eventCount,
			min: (x.value as AggregationResult).min,
			mean: (x.value as AggregationResult).mean,
			max: (x.value as AggregationResult).max,
		}))
		return {
			name: ds.name,
			values,
		}
	})
