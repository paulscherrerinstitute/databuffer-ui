export interface DaqPlotYAxis {
	title?: string
	categories?: string[]
	type?: 'linear' | 'logarithmic'
	side?: 'left' | 'right'
	unit?: string
	min?: number
	max?: number
}

export interface DaqPlotDataPoint {
	x: number
	min: number
	mean: number
	max: number
	binSize: number
}

export interface DaqPlotDataSeries {
	name?: string
	yAxis?: number
	data: DaqPlotDataPoint[]
}

export interface DaqPlotConfig {
	title: string
	subtitle: string
	yAxes: DaqPlotYAxis[]
	series: DaqPlotDataSeries[]
}
