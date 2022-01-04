export interface DataUiDataPoint<X, Y> {
	x: X
	y: Y
}

export type DataUiScalarValue = number | boolean | string

export type DataUiAggregatedValue = {
	count: number
	min: number
	mean: number
	max: number
}

export type DataUiImage = number[][]

export type DataUiWaveform = number[]

export interface DataUiDataSeries<X, Y> {
	name: string
	datapoints: DataUiDataPoint<X, Y>[]
}

export type MinMax = { min: number; max: number }
