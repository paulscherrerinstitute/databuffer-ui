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
import 'weightless/popover'
import { Popover } from 'weightless/popover'
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

import {
	formatDate,
	TimeRange,
	timeRangeDay,
	timeRangeWeek,
	timeRangeMonth,
} from '../util'
import { AppState, store } from '../state/store'
import {
	Channel,
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

const TIMESTAMP_PATTERN = `^\\d{4}-\\d{2}-\\d{2}[ T]\\d{2}:\\d{2}:\\d{2}\\.\\d{3}$`
const TIMESTAMP_REGEX = new RegExp(TIMESTAMP_PATTERN)

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
	@property({ attribute: false }) error?: Error
	@property({ attribute: false }) fetching: boolean = false
	@property({ attribute: false }) requestDuration!: number
	@property({ attribute: false }) requestFinishedAt!: number
	@property({ type: Boolean }) shouldDisplayChart!: boolean
	@property({ type: Array }) channelsWithoutData: Channel[] = []
	@property({ type: Boolean }) canPlot: boolean = false
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

	private __calcCanPlot(): boolean {
		if (this.__txtStartTime === null) return false
		if (TIMESTAMP_REGEX.test(this.__txtStartTime.value) === false) return false
		if (this.__txtEndTime === null) return false
		if (TIMESTAMP_REGEX.test(this.__txtEndTime.value) === false) return false
		return true
	}

	private __chart!: Highcharts.Chart

	@query('#queryrange')
	private __queryRange!: Popover

	@query('#quickdial')
	private __quickDial!: Popover

	@query('#starttime')
	private __txtStartTime!: TextField

	@query('#endtime')
	private __txtEndTime!: TextField

	@query('#chart')
	private __chartContainer!: HTMLElement

	@query('#daqplot')
	private __daqplot!:
		| DaqPlotSingleAxisElement
		| DaqPlotSeparateAxesElement
		| DaqPlotSeparatePlotsElement

	@query('#badtimeformat')
	private __snackBadTimeFormat!: Snackbar

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
			error: plotSelectors.error(state),
			channels: plotSelectors.channels(state),
			startTime: plotSelectors.startTime(state),
			endTime: plotSelectors.endTime(state),
			fetching: plotSelectors.fetching(state),
			response: plotSelectors.response(state),
			requestDuration: plotSelectors.requestDuration(state),
			requestFinishedAt: plotSelectors.requestFinishedAt(state),
			shouldDisplayChart: plotSelectors.shouldDisplayChart(state),
			channelsWithoutData: plotSelectors.channelsWithoutData(state),
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

	firstUpdated() {
		this.canPlot = this.__calcCanPlot()
	}

	updated(changedProperties: PropertyValues): void {
		if (changedProperties.has('channelsWithoutData')) {
			if (this.channelsWithoutData.length === this.channels.length) {
				this.__snackNoData.show()
			} else if (this.channelsWithoutData.length > 0) {
				this.__snackPartialData.show()
			}
		}
		if (
			changedProperties.has('startTime') ||
			changedProperties.has('endTime')
		) {
			this.canPlot = this.__calcCanPlot()
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

	private __showQuickDial() {
		this.__quickDial.show()
	}

	private __setTimeRange(range: TimeRange) {
		store.dispatch.plot.changeEndTime(range.end)
		store.dispatch.plot.changeStartTime(range.start)
	}

	private __quickDialRelative(deltaMs: number) {
		const end = Date.now()
		const start = end - deltaMs
		this.__setTimeRange({ start, end })
	}

	private __quickDialYesterday() {
		const range = timeRangeDay(datefns.subDays(new Date(), 1).getTime())
		this.__setTimeRange(range)
	}

	private __quickDialToday() {
		const range = timeRangeDay(Date.now())
		this.__setTimeRange(range)
	}

	private __quickDialLastWeek() {
		const range = timeRangeWeek(datefns.subWeeks(new Date(), 1).getTime())
		this.__setTimeRange(range)
	}

	private __quickDialThisWeek() {
		const range = timeRangeWeek(Date.now())
		this.__setTimeRange(range)
	}

	private __quickDialLastMonth() {
		const range = timeRangeMonth(datefns.subMonths(new Date(), 1).getTime())
		this.__setTimeRange(range)
	}

	private __quickDialThisMonth() {
		const range = timeRangeMonth(Date.now())
		this.__setTimeRange(range)
	}

	private __plot() {
		store.dispatch.plot.drawPlot()
	}

	private __onStartTimeChanged(e: Event) {
		const txt = e.target as TextField
		const d = datefns.parseISO(txt.value).getTime()
		if (isNaN(d)) {
			txt.focus()
			this.__snackBadTimeFormat.show()
			this.canPlot = false
			return
		}
		store.dispatch.plot.changeStartTime(d)
	}

	private __onEndTimeChanged(e: Event) {
		const txt = e.target as TextField
		const d = datefns.parseISO(txt.value).getTime()
		if (isNaN(d)) {
			txt.focus()
			this.__snackBadTimeFormat.show()
			this.canPlot = false
			return
		}
		store.dispatch.plot.changeEndTime(d)
	}

	// we must define __keydown with an arrow function, not as a regular method,
	// to make sure, that `this` is bound correctly
	// otherwise, it will be the window object (when called at runtime)
	private __keydown = (e: KeyboardEvent) => {
		if (e.repeat) return
		if (e.key !== KEY_RELOAD_ZOOM) return
		;(() => {
			this.reloadOnZoom = true
		})()
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
			${this.__renderQueryRange()} ${this.__renderQuickDial()}
			${this.__renderShare()} ${this.__renderDownload()}
			<wl-progress-spinner ?hidden=${!this.fetching}></wl-progress-spinner>
			<div class="error" ?hidden=${!this.error}>
				There was an error:
				<p>${this.error ? this.error.message : ''}</p>
			</div>
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
		`
	}

	private __renderQueryRange(): TemplateResult {
		return html`
			<div id="queryrange" ?hidden=${!this.queryRangeShowing}>
				<div id="queryrangecontainer">
					<mwc-textfield
						id="starttime"
						label="Start"
						value="${formatDate(this.startTime)}"
						pattern="${TIMESTAMP_PATTERN}"
						@change=${this.__onStartTimeChanged}
						helper="yyyy-mm-dd HH:MM:DD.SSS"
					></mwc-textfield>
					<mwc-textfield
						id="endtime"
						label="End"
						value="${formatDate(this.endTime)}"
						pattern="${TIMESTAMP_PATTERN}"
						@change=${this.__onEndTimeChanged}
						helper="yyyy-mm-dd HH:MM:DD.SSS"
					></mwc-textfield>
					<div id="buttons">
						<mwc-icon-button
							id="btnQuickDial"
							@click="${this.__showQuickDial}"
							icon="more_horiz"
							label="quick-dial"
						></mwc-icon-button>
						<mwc-button
							@click="${this.__plot}"
							?disabled=${!this.canPlot}
							icon="show_chart"
							label="plot"
							raised
						></mwc-button>
					</div>
				</div>
			</div>
		`
	}

	private __renderQuickDial(): TemplateResult {
		return html`
			<wl-popover id="quickdial" closeOnClick fixed anchor="#btnQuickDial">
				<wl-popover-card>
					<wl-list-item
						clickable
						@click="${() => this.__quickDialRelative(60_000)}"
						>last 1m</wl-list-item
					>
					<wl-list-item
						clickable
						@click="${() => this.__quickDialRelative(600_000)}"
						>last 10m</wl-list-item
					>
					<wl-list-item
						clickable
						@click="${() => this.__quickDialRelative(3_600_000)}"
						>last 1h</wl-list-item
					>
					<wl-list-item
						value="43200"
						clickable
						@click="${() => this.__quickDialRelative(43_200_000)}"
						>last 12h</wl-list-item
					>
					<wl-list-item
						clickable
						@click="${() => this.__quickDialRelative(86_400_000)}"
						>last 24h</wl-list-item
					>
					<wl-list-item
						value="604800"
						clickable
						@click="${() => this.__quickDialRelative(604_800_000)}"
						>last 7d</wl-list-item
					>
					<wl-divider></wl-divider>
					<wl-list-item clickable @click="${this.__quickDialYesterday}"
						>yesterday</wl-list-item
					>
					<wl-list-item clickable @click="${this.__quickDialToday}"
						>today</wl-list-item
					>
					<wl-list-item clickable @click="${this.__quickDialLastWeek}"
						>last week</wl-list-item
					>
					<wl-list-item clickable @click="${this.__quickDialThisWeek}"
						>this week</wl-list-item
					>
					<wl-list-item clickable @click="${this.__quickDialLastMonth}"
						>last month</wl-list-item
					>
					<wl-list-item clickable @click="${this.__quickDialThisMonth}"
						>this month</wl-list-item
					>
				</wl-popover-card>
			</wl-popover>
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
				<mwc-formfield label="Download data of plot (as is)">
					<mwc-radio
						name="aggregationmode"
						?checked=${this.dialogDownloadAggregation == 'as-is'}
						value="as-is"
						@change=${this._updateAggregation}
					></mwc-radio>
				</mwc-formfield>
				<hr />
				<mwc-formfield label="Aggregate by 5 seconds">
					<mwc-radio
						name="aggregationmode"
						?checked=${this.dialogDownloadAggregation == 'PT5S'}
						value="PT5S"
						@change=${this._updateAggregation}
					></mwc-radio>
				</mwc-formfield>
				<mwc-formfield label="Aggregate by 1 minute">
					<mwc-radio
						name="aggregationmode"
						?checked=${this.dialogDownloadAggregation == 'PT1M'}
						value="PT1M"
						@change=${this._updateAggregation}
					></mwc-radio>
				</mwc-formfield>
				<mwc-formfield label="Aggregate by 1 hour">
					<mwc-radio
						name="aggregationmode"
						?checked=${this.dialogDownloadAggregation == 'PT1H'}
						value="PT1H"
						@change=${this._updateAggregation}
					></mwc-radio>
				</mwc-formfield>
				<hr />
				<mwc-formfield label="Get raw data">
					<mwc-radio
						name="aggregationmode"
						?checked=${this.dialogDownloadAggregation == 'raw'}
						value="raw"
						@change=${this._updateAggregation}
					></mwc-radio>
				</mwc-formfield>
				<p>
					<strong>Please note</strong> that you are about to fetch data from the
					data API <strong>again</strong>. Depending on the channels and
					aggregation settings this <strong>may take a long time</strong> and
					result in a <strong>very large file</strong>.
				</p>
				<mwc-button
					icon="content_copy"
					@click=${async () => {
						try {
							await navigator.clipboard.writeText(
								this.dialogDownloadCurlCommand
							)
							this.__snackCurlCopied.show()
						} catch (e) {
							console.error(e)
						}
					}}
					>copy curl command to clipboard</mwc-button
				>
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
				#queryrange {
					position: absolute;
					width: calc(100% - 16px);
					z-index: 1;
					background-color: white;
					box-shadow: rgba(0, 0, 0, 0.2) 0px 2px 4px -1px,
						rgba(0, 0, 0, 0.14) 0px 4px 5px 0px,
						rgba(0, 0, 0, 0.12) 0px 1px 10px 0px;
					border-radius: 2px;
				}
				#queryrangecontainer {
					margin: 8px 0 8px 8px;
					display: flex;
					flex-direction: row;
					align-items: center;
					gap: 8px;
				}
				#queryrangecontainer * {
					margin-right: 8px;
				}
				#starttime,
				#endtime {
					flex-grow: 1;
				}
				#buttons {
					margin: 8px 0;
					display: inline;
				}
				wl-progress-spinner {
					width: 96px;
					height: 96px;
					margin: 8px auto;
				}
				[hidden] {
					display: none;
				}
				#chart {
					height: 100%;
				}
				#quickdial {
					max-height: 80vh;
					--list-item-border-radius: 0;
				}
				.error {
					border: 2px solid rgba(127, 0, 0, 1);
					border-radius: 4px;
					margin: 4px;
					padding: 2rem;
					background-color: rgba(255, 200, 200, 0.3);
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
