import {
	LitElement,
	customElement,
	html,
	property,
	css,
	query,
	TemplateResult,
	PropertyValues,
} from 'lit-element'

import Highcharts from 'highcharts'
import highchartsMore from 'highcharts/highcharts-more'
import 'weightless/card'
import 'weightless/divider'
import 'weightless/expansion'
import 'weightless/list-item'
import 'weightless/popover-card'
import 'weightless/progress-spinner'
import '@material/mwc-button'
import '@material/mwc-dialog'
import '@material/mwc-formfield'
import '@material/mwc-icon-button'
import '@material/mwc-radio'
import { Radio } from '@material/mwc-radio'
import '@material/mwc-textfield'
import { TextField } from '@material/mwc-textfield'
import '@material/mwc-snackbar'
import { Snackbar } from '@material/mwc-snackbar'
import './daq-plot/daq-plot-separate-axes'
import './daq-plot/daq-plot-separate-plots'
import './daq-plot/daq-plot-single-axis'

import type { TimeRange } from '../util'
import { AppState, store } from '../state/store'
import {
	Channel,
	DataRequestMeta,
	DataSeries,
	DownloadAggregation,
	plotSelectors,
	PlotVariation,
} from '../state/models/plot'

import * as datefns from 'date-fns'
import type { DataResponse } from '../api/queryrest'
import { baseStyles } from './shared-styles'
import { connect } from '@captaincodeman/rdx'
import type {
	DaqPlotConfig,
	DaqPlotDataSeries,
	DaqPlotYAxis,
} from './daq-plot/types'
import type { DaqPlotSingleAxisElement } from './daq-plot/daq-plot-single-axis'
import type { DaqPlotSeparateAxesElement } from './daq-plot/daq-plot-separate-axes'
import type { DaqPlotSeparatePlotsElement } from './daq-plot/daq-plot-separate-plots'
import './daq-range-select'

const IS_MAC = window.navigator.appVersion.toLowerCase().indexOf('mac') >= 0
const KEY_RELOAD_ZOOM = IS_MAC ? 'Meta' : 'Ctrl'

// see https://www.highcharts.com/forum/viewtopic.php?t=35113
highchartsMore(Highcharts)

@customElement('view-standard-plot')
export class StandardPlotElement extends connect(store, LitElement) {
	@property({ attribute: false }) response: DataResponse = []
	@property({ attribute: false }) startTime: number = 1
	@property({ attribute: false }) endTime: number = 2
	@property({ attribute: false }) channels: Channel[] = []
	@property({ attribute: false }) anyRequestErrors: boolean = false
	@property({ attribute: false }) dataRequests: DataRequestMeta[] = []
	@property({ attribute: false }) pendingRequests: number = 0
	@property({ attribute: false }) allRequestsFinished: boolean = true
	@property({ attribute: false }) requestDuration!: number
	@property({ attribute: false }) requestFinishedAt!: number
	@property({ type: Boolean }) shouldDisplayChart!: boolean
	@property({ type: Array }) channelsWithoutData: Channel[] = []
	@property({ attribute: false }) queryRangeShowing: boolean = false
	@property({ attribute: false }) dialogShareLinkShowing: boolean = false
	@property({ attribute: false }) dialogShareLinkAbsoluteTimes: boolean = false
	@property({ attribute: false }) dialogShareLinkUrl!: string
	@property({ attribute: false })
	dialogShareLinkChannelsTruncated: boolean = false
	@property({ attribute: false })
	dialogDownloadShowing: boolean = false
	@property({ attribute: false }) dialogDownloadAggregation!: string
	@property({ attribute: false }) plotVariation!: PlotVariation
	@property({ attribute: false }) daqPlotConfig!: DaqPlotConfig

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
			anyRequestErrors: plotSelectors.anyRequestErrors(state),
			dataRequests: plotSelectors.dataRequests(state),
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
			dialogDownloadCurlCommand: plotSelectors.dialogDownloadCurlCommand(state),
			plotVariation: plotSelectors.plotVariation(state),
			daqPlotConfig: plotSelectors.daqPlotConfig(state),
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
					.title=${this.daqPlotConfig.title}
					.subtitle=${this.daqPlotConfig.subtitle}
					.yAxes=${this.daqPlotConfig.yAxes}
					.xMin=${this.startTime}
					.xMax=${this.endTime}
					.series=${this.daqPlotConfig.series}
				></daq-plot-separate-plots>`

			case PlotVariation.SeparateAxes:
				return html`<daq-plot-separate-axes
					id="daqplot"
					.title=${this.daqPlotConfig.title}
					.subtitle=${this.daqPlotConfig.subtitle}
					.yAxes=${this.daqPlotConfig.yAxes}
					.xMin=${this.startTime}
					.xMax=${this.endTime}
					.series=${this.daqPlotConfig.series}
				></daq-plot-separate-axes>`

			case PlotVariation.SingleAxis:
				return html`<daq-plot-single-axis
					id="daqplot"
					.title=${this.daqPlotConfig.title}
					.subtitle=${this.daqPlotConfig.subtitle}
					.yAxes=${this.daqPlotConfig.yAxes}
					.xMin=${this.startTime}
					.xMax=${this.endTime}
					.series=${this.daqPlotConfig.series}
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

	render() {
		return html`
			${this.__renderShare()} ${this.__renderDownload()}
			<daq-range-select
				id="queryrange"
				?hidden=${!this.queryRangeShowing}
				@badtimeformat=${() => this.__snackBadTimeFormat.show()}
			></daq-range-select>
			<wl-progress-spinner
				?hidden=${this.pendingRequests === 0}
			></wl-progress-spinner>
			<div
				@highchartszoom=${this.__onHighchartsZoom}
				id="chart"
				?hidden="${!this.shouldDisplayChart}"
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
				<p>
					We are very sorry, but the download feature is disabled while we are
					migrating API versions.
				</p>
			</div>
			<mwc-button slot="secondaryAction" dialogAction="close">close</mwc-button>
		</mwc-dialog>`
	}

	_updateAggregation(e: Event) {
		const el = e.target as Radio
		if (!el.checked) return
		store.dispatch.plot.setDownloadAggregation(el.value as DownloadAggregation)
	}

	static get styles() {
		return [
			baseStyles,
			css`
				:host {
					height: 100%;
					padding: 8px;
					display: block;
					overflow-y: auto;
				}
				wl-progress-spinner {
					width: 96px;
					height: 96px;
					margin: 8px auto;
				}
				[hidden] {
					display: none;
				}
				#queryrange {
					z-index: 1;
					position: absolute;
					width: calc(100% - 16px);
				}
				#chart {
					height: 100%;
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
				#dialog-download div,
				#dialog-download mwc-radio {
					display: flex;
				}
				#dialog-download mwc-textfield {
					flex: 1;
				}
				#dialog-download > div {
					flex-direction: column;
				}
				#dialog-download [hidden] {
					display: none;
				}
			`,
		]
	}
}
