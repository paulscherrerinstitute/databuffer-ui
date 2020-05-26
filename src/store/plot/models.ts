export interface Channel {
	backend: string
	name: string
}

export enum QueryMode {
	TIME = 'time',
	PULSE = 'pulse',
}

export interface DataPoints {
	channel: Channel
	values: number[]
}

/** DataSeries defines a data set to be plotted in the chart */
export interface DataSeries {
	/** name allows the data series to use a non-technical label */
	name: string
	/** channelIndex is the index into the array of selected channels */
	channelIndex: number
	/** yAxisIndex is the index into the array of defined Y axes */
	yAxisIndex: number
}

/** type of YAxis */
export type YAxisType = 'linear' | 'logarithmic'

/** YAxis is a value axis of the chart */
export interface YAxis {
	/** title defines the label next to the axis */
	title: string
	/** unit of values on the axis, e.g. 'mbar' */
	unit: string
	/** side defines where on the plot the axis should be put */
	side: 'left' | 'right'
	/** lowest allowed value. set to null for automatic minimum. */
	min: number | null
	/** highest value. set to null for automatic maximum. */
	max: number | null
	/** type of axis */
	type: YAxisType
}
