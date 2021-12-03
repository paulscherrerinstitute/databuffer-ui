import { DataUiChannel } from '../../../shared/channel'
import { DataUiDataPoint } from '../../../shared/dataseries'

export enum PlotVariation {
	/** 1 Y axis for all channels */
	SingleAxis = 'single-axis',

	/** 1 Y axis for each channel */
	SeparateAxes = 'separate-axes',

	/** 1 plot (with 1 Y axis) for each channel */
	SeparatePlots = 'separate-plots',
}
export function isPlotVariation(val: unknown): val is PlotVariation {
	if (typeof val !== 'string') return false
	return Object.values(PlotVariation as Record<string, string>).includes(val)
}

/** type of YAxis */
export type YAxisType = 'linear' | 'logarithmic'
export function isYAxisType(val: unknown): val is YAxisType {
	if (typeof val !== 'string') return false
	return val === 'linear' || val === 'logarithmic'
}

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
	/** categories, for string data series */
	categories?: string[]
}

export type DownloadAggregation = 'PT5S' | 'PT1M' | 'PT1H'
export type CsvFieldSeparator = 'tab' | 'comma' | 'semicolon'
export type CsvFieldQuotes = 'none' | 'double' | 'single'
export type CsvLineTerminator = 'crlf' | 'lf'

export type PlotDataSeries = {
	channel: DataUiChannel
	label: string
	yAxisIndex: number
	fetching?: boolean
	error?: Error
	requestSentAt?: number
	requestFinishedAt?: number
	datapoints?: DataUiDataPoint<number, unknown>[]
}

export interface PlotState {
	plotVariation: PlotVariation
	plotTitle: string
	startTime: number
	endTime: number
	queryExpansion: boolean
	dataSeries: PlotDataSeries[]
	yAxes: YAxis[]
	queryRangeShowing: boolean
	dialogShareLinkShowing: boolean
	dialogShareLinkAbsoluteTimes: boolean
	dialogDownloadShowing: boolean
	dialogDownloadAggregation: DownloadAggregation
	csvFieldSeparator: CsvFieldSeparator
	csvFieldQuotes: CsvFieldQuotes
	csvLineTerminator: CsvLineTerminator
}
