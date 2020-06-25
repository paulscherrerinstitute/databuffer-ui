import {
	LitElement,
	customElement,
	html,
	property,
	css,
	query,
	CSSResult,
	TemplateResult,
} from 'lit-element'

import Highcharts from 'highcharts'
import highchartsMore from 'highcharts/highcharts-more'
import 'weightless/card'
import 'weightless/divider'
import 'weightless/expansion'
import 'weightless/list-item'
import { ListItem } from 'weightless/list-item'
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

import { formatDate } from '../util'
import { RootState, RoutingActions, store } from '../store'
import {
	Channel,
	PlotActions,
	PlotSelectors,
	DownloadAggregation,
} from '../store/plot/'

import * as datefns from 'date-fns'
import type { DataResponse } from '../api/queryrest'
import { baseStyles } from './shared-styles'
import { connect } from '@captaincodeman/redux-connect-element'

const TIMESTAMP_PATTERN = `^\\d{4}-\\d{2}-\\d{2}[ T]\\d{2}:\\d{2}:\\d{2}\\.\\d{3}$`
const TIMESTAMP_REGEX = new RegExp(TIMESTAMP_PATTERN)

const IS_MAC = window.navigator.appVersion.toLowerCase().indexOf('mac') >= 0
const KEY_RELOAD_ZOOM = IS_MAC ? 'Meta' : 'Ctrl'
let reloadOnZoom = false

// see https://www.highcharts.com/forum/viewtopic.php?t=35113
highchartsMore(Highcharts)

@customElement('view-standard-plot')
export class StandardPlotElement extends connect(store, LitElement) {
	@property({ type: Array }) response: DataResponse
	@property({ type: Number }) startTime: number
	@property({ type: Number }) endTime: number
	@property({ type: Array }) channels: Channel[]
	@property({ type: Object }) error: Error
	@property({ type: Boolean }) fetching: boolean
	@property({ type: Number }) requestDuration: number
	@property({ type: Number }) requestFinishedAt: number
	@property({ type: Boolean }) shouldDisplayChart: boolean
	@property({ type: Array }) channelsWithoutData: Channel[]
	@property({ type: Boolean }) canPlot: boolean = false
	@property({ attribute: false }) highchartsOptions: Highcharts.Options
	@property({ attribute: false }) queryRangeShowing: boolean = false
	@property({ attribute: false }) dialogShareLinkShowing: boolean = false
	@property({ attribute: false }) dialogShareLinkAbsoluteTimes: boolean = false
	@property({ attribute: false }) dialogShareLinkUrl: string
	@property({ attribute: false })
	dialogShareLinkChannelsTruncated: boolean = false
	@property({ attribute: false })
	dialogDownloadShowing: boolean = false
	@property({ attribute: false }) dialogDownloadAggregation: string

	private dialogDownloadCurlCommand = ''

	private __calcCanPlot(): boolean {
		if (this.__txtStartTime === null) return false
		if (TIMESTAMP_REGEX.test(this.__txtStartTime.value) === false) return false
		if (this.__txtEndTime === null) return false
		if (TIMESTAMP_REGEX.test(this.__txtEndTime.value) === false) return false
		return true
	}

	private __chart: Highcharts.Chart

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

	mapState(state: RootState) {
		return {
			error: PlotSelectors.error(state),
			channels: PlotSelectors.channels(state),
			startTime: PlotSelectors.startTime(state),
			endTime: PlotSelectors.endTime(state),
			fetching: PlotSelectors.fetching(state),
			response: PlotSelectors.response(state),
			highchartsOptions: PlotSelectors.highchartsOptions(state),
			requestDuration: PlotSelectors.requestDuration(state),
			requestFinishedAt: PlotSelectors.requestFinishedAt(state),
			shouldDisplayChart: PlotSelectors.shouldDisplayChart(state),
			channelsWithoutData: PlotSelectors.channelsWithoutData(state),
			queryRangeShowing: PlotSelectors.queryRangeShowing(state),
			dialogShareLinkShowing: PlotSelectors.dialogShareLinkShowing(state),
			dialogShareLinkAbsoluteTimes: PlotSelectors.dialogShareLinkAbsoluteTimes(
				state
			),
			dialogShareLinkUrl: PlotSelectors.dialogShareLinkUrl(state),
			dialogShareLinkChannelsTruncated: PlotSelectors.dialogShareLinkChannelsTruncated(
				state
			),
			dialogDownloadShowing: PlotSelectors.dialogDownloadShowing(state),
			dialogDownloadAggregation: PlotSelectors.dialogDownloadAggregation(state),
			dialogDownloadCurlCommand: PlotSelectors.dialogDownloadCurlCommand(state),
		}
	}

	mapEvents() {
		return {
			'draw-plot': () => PlotActions.drawPlot(),
			'start-time-change': (e: CustomEvent<{ startTime: number }>) =>
				PlotActions.startTimeChange(e.detail.startTime),
			'end-time-change': (e: CustomEvent<{ endTime: number }>) =>
				PlotActions.endTimeChange(e.detail.endTime),
			'dialog-share:closed': () => PlotActions.hideShareLink(),
			'dialog-share:absolute-times': e =>
				e.detail.absTimes
					? PlotActions.shareAbsoluteTimes()
					: PlotActions.shareRelativeTime(),
			'dialog-download:closed': () => PlotActions.hideDownload(),
			'dialog-download:setaggregation': (
				e: CustomEvent<{ aggregation: DownloadAggregation }>
			) => PlotActions.setDownloadAggregation(e.detail.aggregation),
			'dialog-download:download': () => PlotActions.downloadData(),
		}
	}

	firstUpdated() {
		this.__chart = Highcharts.chart(this.__chartContainer, {
			chart: {
				type: 'line',
				events: {
					selection: (e: Highcharts.ChartSelectionContextObject): boolean => {
						if (reloadOnZoom) {
							this.__setTimeRange(e.xAxis[0].min, e.xAxis[0].max)
							this.__plot()
							return false
						}
						return true
					},
				},
				panKey: 'shift',
				panning: {
					enabled: true,
					type: 'xy',
				},
				zoomType: 'xy',
			},
			exporting: {
				csv: {
					dateFormat: '%Y-%m%d %H:%M:%S.%L',
				},
				fallbackToExportServer: false,
			},
			series: [],
			xAxis: {
				type: 'datetime',
				crosshair: true,
			},
			time: {
				useUTC: false,
			},
			tooltip: { shared: true },
		})
		this.canPlot = this.__calcCanPlot()
	}

	updated(changedProperties) {
		if (changedProperties.has('highchartsOptions')) {
			this.__chart.update(this.highchartsOptions, true, true)
		}
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

	private __setTimeRange(startTime: number, endTime: number) {
		this.dispatchEvent(
			new CustomEvent<{ endTime: number }>('end-time-change', {
				detail: { endTime },
			})
		)
		this.dispatchEvent(
			new CustomEvent<{ startTime: number }>('start-time-change', {
				detail: { startTime },
			})
		)
	}

	private __quickDialRelative(deltaMs: number) {
		const endTime = Date.now()
		const startTime = endTime - deltaMs
		this.__setTimeRange(startTime, endTime)
	}

	private __quickDialYesterday() {
		const d = datefns.subDays(new Date(), 1)
		d.setHours(0, 0, 0, 0)
		const startTime = d.getTime()
		d.setHours(23, 59, 59, 999)
		const endTime = d.getTime()
		this.__setTimeRange(startTime, endTime)
	}

	private __quickDialToday() {
		const d = new Date()
		d.setHours(0, 0, 0, 0)
		const startTime = d.getTime()
		d.setHours(23, 59, 59, 999)
		const endTime = d.getTime()
		this.__setTimeRange(startTime, endTime)
	}

	private __quickDialLastWeek() {
		const d = datefns.setDay(datefns.subDays(new Date(), 7), 1, {
			weekStartsOn: 1,
		})
		d.setHours(0, 0, 0, 0)
		const startTime = d.getTime()
		d.setHours(23, 59, 59, 999)
		const endTime = datefns.addDays(d, 6).getTime()
		this.__setTimeRange(startTime, endTime)
	}

	private __quickDialThisWeek() {
		const d = datefns.setDay(new Date(), 1, {
			weekStartsOn: 1,
		})
		d.setHours(0, 0, 0, 0)
		const startTime = d.getTime()
		d.setHours(23, 59, 59, 999)
		const endTime = datefns.addDays(d, 6).getTime()
		this.__setTimeRange(startTime, endTime)
	}

	private __quickDialLastMonth() {
		const d = datefns.setDate(datefns.subMonths(new Date(), 1), 1)
		d.setHours(0, 0, 0, 0)
		const startTime = d.getTime()
		d.setHours(23, 59, 59, 999)
		const endTime = datefns.lastDayOfMonth(d).getTime()
		this.__setTimeRange(startTime, endTime)
	}

	private __quickDialThisMonth() {
		const d = datefns.setDate(new Date(), 1)
		d.setHours(0, 0, 0, 0)
		const startTime = d.getTime()
		d.setHours(23, 59, 59, 999)
		const endTime = datefns.lastDayOfMonth(d).getTime()
		this.__setTimeRange(startTime, endTime)
	}

	private __plot() {
		const e = new CustomEvent('draw-plot', {
			composed: true,
			bubbles: true,
			detail: {
				startTime: this.startTime,
				endTime: this.endTime,
			},
		})
		this.dispatchEvent(e)
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
		this.dispatchEvent(
			new CustomEvent<{ startTime: number }>('start-time-change', {
				detail: { startTime: d },
			})
		)
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
		this.dispatchEvent(
			new CustomEvent<{ endTime: number }>('end-time-change', {
				detail: { endTime: d },
			})
		)
	}

	private __keydown(e: KeyboardEvent) {
		if (e.repeat) return
		if (e.key !== KEY_RELOAD_ZOOM) return
		reloadOnZoom = true
	}

	private __keyup(e: KeyboardEvent) {
		if (e.key !== KEY_RELOAD_ZOOM) return
		reloadOnZoom = false
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
			<div id="chart" ?hidden="${!this.shouldDisplayChart}"></div>
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
			@closed=${() =>
				this.dispatchEvent(new CustomEvent('dialog-share:closed'))}
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
						@change=${e =>
							this.dispatchEvent(
								new CustomEvent('dialog-share:absolute-times', {
									detail: { absTimes: e.target.checked },
								})
							)}
					></mwc-radio>
				</mwc-formfield>
				<mwc-formfield label="Use relative time span (e.g. last 1h)">
					<mwc-radio
						name="a"
						?checked=${!this.dialogShareLinkAbsoluteTimes}
						@change=${e =>
							this.dispatchEvent(
								new CustomEvent('dialog-share:absolute-times', {
									detail: { absTimes: !e.target.checked },
								})
							)}
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
			@closed=${e => {
				if (e.target !== this.shadowRoot.getElementById('dialog-download'))
					return
				if (e.detail.action == 'download') {
					this.dispatchEvent(new CustomEvent('dialog-download:download'))
					this.__snackDownloadStarted.show()
				}
				this.dispatchEvent(new CustomEvent('dialog-download:closed'))
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
		this.dispatchEvent(
			new CustomEvent<{ aggregation: DownloadAggregation }>(
				'dialog-download:setaggregation',
				{
					detail: {
						aggregation: el.value as DownloadAggregation,
					},
				}
			)
		)
	}

	static get styles() {
		return [
			baseStyles,
			css`
				:host {
					height: 100%;
					padding: 8px;
					display: block;
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
