export interface DataUiDataPoint<X, Y> {
	x: X
	y: Y
}

export type DataUiAggregatedValue = {
	count: number
	min: number
	mean: number
	max: number
}

export interface DataUiDataSeries<X, Y> {
	name: string
	datapoints: DataUiDataPoint<X, Y>[]
}
