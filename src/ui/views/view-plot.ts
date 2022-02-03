import { LitElement, html, css, PropertyValues } from 'lit'
import { customElement, query, state } from 'lit/decorators.js'

import Highcharts from 'highcharts'
import highchartsMore from 'highcharts/highcharts-more'
import 'weightless/card'
import 'weightless/divider'
import 'weightless/expansion'
import 'weightless/list-item'
import 'weightless/popover-card'
import '@material/mwc-button'
import '@material/mwc-circular-progress'
import '@material/mwc-dialog'
import '@material/mwc-formfield'
import '@material/mwc-icon-button'
import '@material/mwc-list/mwc-list-item'
import '@material/mwc-radio'
import type { Radio } from '@material/mwc-radio'
import '@material/mwc-select'
import type { Select } from '@material/mwc-select'
import '@material/mwc-textfield'
import '@material/mwc-snackbar'
import type { Snackbar } from '@material/mwc-snackbar'
import '../components/daq-plot-separate-axes'
import '../components/daq-plot-separate-plots'
import '../components/daq-plot-single-axis'

import { formatDate, TimeRange } from '../../util'
import { AppState, store } from '../../state/store'
import {
	PlotDataSeries,
	CsvFieldQuotes,
	CsvFieldSeparator,
	CsvLineTerminator,
	DownloadAggregation,
	plotSelectors,
	PlotVariation,
	YAxis,
} from '../../state/models/plot'

import { baseStyles } from '../shared-styles'
import { connect } from '@captaincodeman/rdx'
import type { DaqPlotSingleAxisElement } from '../components/daq-plot-single-axis'
import type { DaqPlotSeparateAxesElement } from '../components/daq-plot-separate-axes'
import type { DaqPlotSeparatePlotsElement } from '../components/daq-plot-separate-plots'
import '../components/daq-range-select'
import type { DataUiChannel } from '../../shared/channel'

const IS_MAC = window.navigator.appVersion.toLowerCase().indexOf('mac') >= 0
const KEY_RELOAD_ZOOM = IS_MAC ? 'Meta' : 'Control'

// see https://www.highcharts.com/forum/viewtopic.php?t=35113
highchartsMore(Highcharts)

@customElement('view-plot')
export class StandardPlotElement extends connect(store, LitElement) {
	@state() startTime: number = 1
	@state() endTime: number = 2
	@state() queryExpansion: boolean = false
	@state() channels: DataUiChannel[] = []
	@state() anyRequestErrors: boolean = false
	@state() pendingRequests: number = 0
	@state() allRequestsFinished: boolean = true
	@state() requestDuration!: number
	@state() requestFinishedAt!: number
	@state() shouldDisplayChart!: boolean
	@state() channelsWithoutData: DataUiChannel[] = []
	@state() queryRangeShowing: boolean = false
	@state() dialogShareLinkShowing: boolean = false
	@state() dialogShareLinkAbsoluteTimes: boolean = false
	@state() dialogShareLinkUrl!: string
	@state()
	dialogShareLinkChannelsTruncated: boolean = false
	@state()
	dialogDownloadShowing: boolean = false
	@state() dialogDownloadAggregation!: string
	@state() csvFieldSeparator!: CsvFieldSeparator
	@state() csvFieldQuotes!: CsvFieldQuotes
	@state() csvLineTerminator!: CsvLineTerminator
	@state() plotVariation!: PlotVariation
	@state() plotTitle: string = ''
	@state() plotSubTitle: string = ''
	@state() plotYAxes: YAxis[] = []
	@state() plotDataSeries: PlotDataSeries[] = []

	private reloadOnZoom = false

	private dialogDownloadCurlCommand = ''

	@query('#daqplot')
	private __daqplot!:
		| DaqPlotSingleAxisElement
		| DaqPlotSeparateAxesElement
		| DaqPlotSeparatePlotsElement

	@query('#badtimeformat')
	private __snackBadTimeFormat!: Snackbar

	@query('#error')
	private __snackError!: Snackbar

	@query('#nodata')
	private __snackNoData!: Snackbar

	@query('#partialdata')
	private __snackPartialData!: Snackbar

	@query('#linkcopied')
	private __snackLinkCopied!: Snackbar

	@query('#linkcopyfailed')
	private __snackLinkCopyFailed!: Snackbar

	@query('#linkchannelstruncated')
	private __snackLinkChannelsTruncated!: Snackbar

	@query('#downloadstarted')
	private __snackDownloadStarted!: Snackbar

	@query('#curlcopied')
	private __snackCurlCopied!: Snackbar

	mapState(state: AppState) {
		return {
			channels: plotSelectors.channels(state),
			startTime: plotSelectors.startTime(state),
			endTime: plotSelectors.endTime(state),
			queryExpansion: plotSelectors.queryExpansion(state),
			anyRequestErrors: plotSelectors.anyRequestErrors(state),
			requestDuration: plotSelectors.totalRequestDuration(state),
			shouldDisplayChart: plotSelectors.shouldDisplayChart(state),
			channelsWithoutData: plotSelectors.channelsWithoutData(state),
			allRequestsFinished: plotSelectors.allRequestsFinished(state),
			pendingRequests: plotSelectors.pendingRequests(state),
			queryRangeShowing: plotSelectors.queryRangeShowing(state),
			dialogShareLinkShowing: plotSelectors.dialogShareLinkShowing(state),
			dialogShareLinkAbsoluteTimes:
				plotSelectors.dialogShareLinkAbsoluteTimes(state),
			dialogShareLinkUrl: plotSelectors.dialogShareLinkUrl(state),
			dialogShareLinkChannelsTruncated:
				plotSelectors.dialogShareLinkChannelsTruncated(state),
			dialogDownloadShowing: plotSelectors.dialogDownloadShowing(state),
			dialogDownloadAggregation: plotSelectors.dialogDownloadAggregation(state),
			csvFieldQuotes: plotSelectors.csvFieldQuotes(state),
			csvFieldSeparator: plotSelectors.csvFieldSeparator(state),
			csvLineTerminator: plotSelectors.csvLineTerminator(state),
			plotVariation: plotSelectors.plotVariation(state),
			plotTitle: plotSelectors.plotTitle(state),
			plotSubTitle: plotSelectors.plotSubTitle(state),
			plotYAxes: plotSelectors.yAxes(state),
			plotDataSeries: plotSelectors.plotDataSeries(state),
		}
	}

	updated(changedProperties: PropertyValues): void {
		if (
			changedProperties.has('allRequestsFinished') &&
			this.allRequestsFinished
		) {
			if (
				this.channelsWithoutData.length === this.channels.length &&
				this.channels.length > 0
			) {
				this.__snackNoData.show()
			} else if (this.channelsWithoutData.length > 0) {
				this.__snackPartialData.show()
			}
		}
		if (this.anyRequestErrors) {
			this.__snackError.show()
		}
		if (changedProperties.has('queryRangeShowing')) {
			this.__daqplot.reflow()
		}
	}

	connectedCallback() {
		window.addEventListener('keydown', this.__keydown)
		window.addEventListener('keyup', this.__keyup)
		super.connectedCallback()
	}

	disconnectedCallback() {
		window.removeEventListener('keydown', this.__keydown)
		window.removeEventListener('keyup', this.__keyup)
		super.disconnectedCallback()
	}

	private __setTimeRange(range: TimeRange) {
		store.dispatch.plot.changeEndTime(range.end)
		store.dispatch.plot.changeStartTime(range.start)
	}

	private __plot() {
		store.dispatch.plot.drawPlot()
	}

	// we must define __keydown with an arrow function, not as a regular method,
	// to make sure, that `this` is bound correctly
	// otherwise, it will be the window object (when called at runtime)
	private __keydown = (e: KeyboardEvent) => {
		if (e.repeat) return
		if (e.key !== KEY_RELOAD_ZOOM) return
		this.reloadOnZoom = true
	}

	// we must define __keyup with an arrow function, not as a regular method,
	// to make sure, that `this` is bound correctly
	// otherwise, it will be the window object (when called at runtime)
	private __keyup = (e: KeyboardEvent) => {
		if (e.key !== KEY_RELOAD_ZOOM) return
		this.reloadOnZoom = false
	}

	private renderPlot() {
		switch (this.plotVariation) {
			case PlotVariation.SeparatePlots:
				return html`<daq-plot-separate-plots
					id="daqplot"
					.title=${this.plotTitle}
					.subtitle=${this.plotSubTitle}
					.yAxes=${this.plotYAxes}
					.xMin=${this.startTime}
					.xMax=${this.endTime}
					.series=${this.plotDataSeries}
				></daq-plot-separate-plots>`

			case PlotVariation.SeparateAxes:
				return html`<daq-plot-separate-axes
					id="daqplot"
					.title=${this.plotTitle}
					.subtitle=${this.plotSubTitle}
					.yAxes=${this.plotYAxes}
					.xMin=${this.startTime}
					.xMax=${this.endTime}
					.series=${this.plotDataSeries}
				></daq-plot-separate-axes>`

			case PlotVariation.SingleAxis:
				return html`<daq-plot-single-axis
					id="daqplot"
					.title=${this.plotTitle}
					.subtitle=${this.plotSubTitle}
					.yAxes=${this.plotYAxes}
					.xMin=${this.startTime}
					.xMax=${this.endTime}
					.series=${this.plotDataSeries}
				></daq-plot-single-axis>`

			default:
				return html``
		}
	}

	private __onHighchartsZoom(e: CustomEvent<TimeRange>) {
		if (this.reloadOnZoom) {
			this.__daqplot.zoomOut()
			this.__setTimeRange(e.detail)
			this.__plot()
			e.preventDefault()
		}
	}

	private __onHighchartsPointClick(
		e: CustomEvent<{
			channel: DataUiChannel
			binStart: number
			binEnd: number
		}>
	) {
		store.dispatch.routing.push('/index-plot')
		const { channel, binStart, binEnd } = e.detail
		store.dispatch.indexplot.selectChannelAndBin({ channel, binStart, binEnd })
	}

	render() {
		return html`
			${this.__renderShare()} ${this.__renderDownload()}
			<daq-range-select
				id="queryrange"
				?hidden=${!this.queryRangeShowing}
				@badtimeformat=${() => this.__snackBadTimeFormat.show()}
			></daq-range-select>
			<mwc-circular-progress
				indeterminate
				?closed=${this.pendingRequests === 0}
				?hidden=${this.pendingRequests === 0}
			></mwc-circular-progress>
			<div
				@highchartszoom=${this.__onHighchartsZoom}
				@highchartspointclick=${this.__onHighchartsPointClick}
				id="chart"
				?hidden=${!this.shouldDisplayChart}
			>
				${this.renderPlot()}
			</div>
			<mwc-snackbar
				id="badtimeformat"
				labelText="Date format invalid! Correct format is: yyyy-mm-dd HH:MM:DD.SSS"
			>
			</mwc-snackbar>
			<mwc-snackbar
				id="nodata"
				labelText="There was no data in the given range."
			></mwc-snackbar>
			<mwc-snackbar
				id="partialdata"
				labelText="${this.channelsWithoutData.length} of ${this.channels
					.length} channels had no data in the given range."
			>
			</mwc-snackbar>
			<mwc-snackbar
				id="linkcopied"
				labelText="Link copied to clipboard"
			></mwc-snackbar>
			<mwc-snackbar
				id="linkcopyfailed"
				labelText="Could not copy link to clipboard. Please copy it yourself."
			></mwc-snackbar>
			<mwc-snackbar
				id="linkchannelstruncated"
				labelText="Only the first 16 channels are linked. The others are truncated."
			></mwc-snackbar>
			<mwc-snackbar
				id="downloadstarted"
				labelText="Your download has been started in the background. Please wait."
			></mwc-snackbar>
			<mwc-snackbar
				id="curlcopied"
				labelText="curl command copied to clipboard"
			></mwc-snackbar>
			<mwc-snackbar
				id="error"
				timeoutMs="-1"
				labelText="Some data requests reported errors."
			>
				<mwc-icon-button icon="close" slot="dismiss"></mwc-icon-button>
			</mwc-snackbar>
		`
	}

	private __renderShare() {
		return html` <mwc-dialog
			id="dialog-share"
			heading="Share link to plot"
			?open=${this.dialogShareLinkShowing}
			@closed=${() => store.dispatch.plot.hideShareLink()}
			@opened=${() => {
				if (this.dialogShareLinkChannelsTruncated)
					this.__snackLinkChannelsTruncated.show()
			}}
		>
			<div>
				<mwc-formfield label="Use absolute times">
					<mwc-radio
						name="a"
						?checked=${this.dialogShareLinkAbsoluteTimes}
						@change=${(e: Event) => {
							if ((e.target as Radio).checked) {
								store.dispatch.plot.shareAbsoluteTimes()
							} else {
								store.dispatch.plot.shareRelativeTimes()
							}
						}}
					></mwc-radio>
				</mwc-formfield>
				<mwc-formfield label="Use relative time span (e.g. last 1h)">
					<mwc-radio
						name="a"
						?checked=${!this.dialogShareLinkAbsoluteTimes}
						@change=${(e: Event) => {
							const el = e.target as Radio
							if (el.checked) {
								store.dispatch.plot.shareRelativeTimes()
							} else {
								store.dispatch.plot.shareAbsoluteTimes()
							}
						}}
					></mwc-radio>
				</mwc-formfield>
				<div>
					<mwc-textfield
						label="Link URL"
						readOnly
						.value=${this.dialogShareLinkUrl}
					></mwc-textfield>
					<mwc-icon-button
						icon="content_copy"
						@click=${async () => {
							try {
								await navigator.clipboard.writeText(this.dialogShareLinkUrl)
								this.__snackLinkCopied.show()
							} catch (e) {
								this.__snackLinkCopyFailed.show()
								console.error(e)
							}
						}}
					></mwc-icon-button>
				</div>
			</div>
			<mwc-button slot="primaryAction" dialogAction="close">close</mwc-button>
		</mwc-dialog>`
	}

	private __renderDownload() {
		return html`<mwc-dialog
			id="dialog-download"
			heading="Download data as CSV"
			?open=${this.dialogDownloadShowing}
			@closed=${(e: CustomEvent<{ action: string }>) => {
				if (e.target !== this.shadowRoot?.getElementById('dialog-download'))
					return
				if (e.detail.action == 'download') {
					store.dispatch.plot.downloadData()
					this.__snackDownloadStarted.show()
				}
				store.dispatch.plot.hideDownload()
			}}
		>
			<div>
				<mwc-select
					label="Create data point every"
					@change=${(e: Event) => {
						if (e.target === null) return
						const v = (e.target as Select).value
						store.dispatch.plot.setDownloadAggregation(v as DownloadAggregation)
					}}
				>
					<mwc-list-item
						?selected=${this.dialogDownloadAggregation === 'PT5S'}
						value="PT5S"
						>5 seconds</mwc-list-item
					>
					<mwc-list-item
						?selected=${this.dialogDownloadAggregation === 'PT1M'}
						value="PT1M"
						>1 minute</mwc-list-item
					>
					<mwc-list-item
						?selected=${this.dialogDownloadAggregation === 'PT1H'}
						value="PT1H"
						>1 hour</mwc-list-item
					>
				</mwc-select>
				<mwc-select
					label="Field separator"
					@change=${(e: Event) => {
						if (e.target === null) return
						const v = (e.target as Select).value
						store.dispatch.plot.setCsvFieldSeparator(v as CsvFieldSeparator)
					}}
				>
					<mwc-list-item
						value="tab"
						?selected=${this.csvFieldSeparator === 'tab'}
						>Tab</mwc-list-item
					>
					<mwc-list-item
						value="comma"
						?selected=${this.csvFieldSeparator === 'comma'}
						>Comma</mwc-list-item
					>
					<mwc-list-item
						value="semicolon"
						?selected=${this.csvFieldSeparator === 'semicolon'}
						>Semicolon</mwc-list-item
					>
				</mwc-select>
				<mwc-select
					label="Field quotes"
					@change=${(e: Event) => {
						if (e.target === null) return
						const v = (e.target as Select).value
						store.dispatch.plot.setCsvFieldQuotes(v as CsvFieldQuotes)
					}}
				>
					<mwc-list-item
						value="none"
						?selected=${this.csvFieldQuotes === 'none'}
						>None</mwc-list-item
					>
					<mwc-list-item
						value="double"
						?selected=${this.csvFieldQuotes === 'double'}
						>Double quotes</mwc-list-item
					>
					<mwc-list-item
						value="single"
						?selected=${this.csvFieldQuotes === 'single'}
						>Single quotes</mwc-list-item
					>
				</mwc-select>
				<mwc-select
					label="Line ends"
					@change=${(e: Event) => {
						if (e.target === null) return
						const v = (e.target as Select).value
						store.dispatch.plot.setCsvLineTerminator(v as CsvLineTerminator)
					}}
				>
					<mwc-list-item
						value="crlf"
						?selected=${this.csvLineTerminator === 'crlf'}
						>Windows (CR LF)</mwc-list-item
					>
					<mwc-list-item value="lf" ?selected=${this.csvLineTerminator === 'lf'}
						>Unix (LF)</mwc-list-item
					>
				</mwc-select>
				<p>
					<strong>Please note</strong> that you are about to fetch
					<strong>raw data</strong> from the data API. Depending on the number
					of data points this <strong>may take a long time</strong> and result
					in a <strong>very large file</strong>.
				</p>
			</div>
			<mwc-button
				raised
				icon="cloud_download"
				slot="primaryAction"
				dialogAction="download"
				>download</mwc-button
			>
			<mwc-button slot="secondaryAction" dialogAction="close">close</mwc-button>
		</mwc-dialog>`
	}

	static get styles() {
		return [
			baseStyles,
			css`
				:host {
					height: 100%;
					width: 100%;
					padding: 8px;
					display: flex;
					flex-direction: column;
				}
				mwc-circular-progress {
					margin: 8px auto;
				}
				[hidden] {
					display: none;
				}
				#queryrange {
					margin-bottom: 8px;
				}
				#chart {
					flex: 1;
					/*
					overflow-y: hidden forces the plot to realize it needs to
					shrink and recalculate its size, as the contents would
					get clipped otherwise.
					Without this setting, the chart will grow bigger when the time
					range is hidden, but it won't shrink, when it is toggled back.
					*/
					overflow-y: hidden;
					border-radius: 2px;
					box-shadow: rgba(0, 0, 0, 0.2) 0px 2px 4px -1px,
						rgba(0, 0, 0, 0.14) 0px 4px 5px 0px,
						rgba(0, 0, 0, 0.12) 0px 1px 10px 0px;
				}
				#dialog-share div,
				#dialog-share mwc-radio {
					display: flex;
				}
				#dialog-share mwc-textfield {
					flex: 1;
				}
				#dialog-share > div {
					flex-direction: column;
				}
				#dialog-download div {
					display: flex;
					flex-direction: column;
				}
				#dialog-download mwc-select {
					margin-top: 8px;
				}
				#dialog-download [hidden] {
					display: none;
				}
			`,
		]
	}
}
