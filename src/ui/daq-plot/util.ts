import { DaqPlotDataPoint } from './types'

export function needsBinning(datapoints: DaqPlotDataPoint[]) {
	for (const p of datapoints) {
		if (p.binSize > 1) return true
	}
	return false
}
