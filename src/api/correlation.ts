import { correlateDataSeries } from '@paulscherrerinstitute/databuffer-query-js/transforms.js'
import type { DataUiDataPoint } from '../shared/dataseries'

export function correlateData(
	xData: DataUiDataPoint<number, number>[],
	yData: DataUiDataPoint<number, number>[]
): DataUiDataPoint<number, number>[] {
	const result = correlateDataSeries(xData, yData)
	return result
}
