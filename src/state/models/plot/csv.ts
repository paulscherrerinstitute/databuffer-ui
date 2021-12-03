import type { DataUiDataSeries } from '../../../shared/dataseries'
import type { CsvOptions } from './types'

export type DataUiCsvDataSeries = DataUiDataSeries<
	number,
	string | number | undefined
>

const FIELD_SEPARATOR = {
	tab: '\t',
	comma: ',',
	semicolon: ';',
}

const FIELD_QUOTES = {
	none: '',
	double: '"',
	single: "'",
}

const LINE_TERMINATOR = {
	crlf: '\r\n',
	lf: '\n',
}

export function createCsvLine(
	values: (string | number)[],
	opts: CsvOptions
): string {
	const sep = FIELD_SEPARATOR[opts.fieldSeparator]
	const q = FIELD_QUOTES[opts.fieldQuotes]
	return values.map(v => q + v + q).join(sep)
}

export function createCsvFile(
	csvDataSeries: DataUiCsvDataSeries[],
	opts: CsvOptions
) {
	const n = csvDataSeries[0].datapoints.length
	const lines: string[] = [
		createCsvLine(
			['index', 'timestamp (utc)', ...csvDataSeries.map(x => x.name)],
			opts
		),
	]
	for (let i = 0; i < n; i++) {
		const t = new Date(csvDataSeries[0].datapoints[i].x).toISOString()
		const values = [i, t, ...csvDataSeries.map(x => x.datapoints[i].y ?? '')]
		lines.push(createCsvLine(values, opts))
	}
	return lines.join(LINE_TERMINATOR[opts.lineTerminator])
}
