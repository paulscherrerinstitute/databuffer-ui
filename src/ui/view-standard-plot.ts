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
import { connect } from '@captaincodeman/redux-connect-element'

import Highcharts from 'highcharts'
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
import '@material/mwc-icon-button'
import '@material/mwc-textfield'
import { TextField } from '@material/mwc-textfield'
import '@material/mwc-snackbar'
import { Snackbar } from '@material/mwc-snackbar'

import { formatDate } from '../util'
import { store, RootState } from '../store'
import { Channel, PlotActions, PlotSelectors } from '../store/plot/'
import { channelToId } from '@psi/databuffer-query-js/channel'

import * as datefns from 'date-fns'
import type { DataResponse } from '../api/queryrest'

const TIMESTAMP_PATTERN = `^\\d{4}-\\d{2}-\\d{2}[ T]\\d{2}:\\d{2}:\\d{2}\\.\\d{3}$`
const TIMESTAMP_REGEX = new RegExp(TIMESTAMP_PATTERN)

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

	private __calcCanPlot(): boolean {
		if (this.__txtStartTime === null) return false
		if (TIMESTAMP_REGEX.test(this.__txtStartTime.value) === false) return false
		if (this.__txtEndTime === null) return false
		if (TIMESTAMP_REGEX.test(this.__txtEndTime.value) === false) return false
		return true
	}

	private __chart: Highcharts.Chart

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
		}
	}

	mapEvents() {
		return {
			'draw-plot': (e: CustomEvent) =>
				PlotActions.drawPlot(e.detail.startTime, e.detail.endTime),
		}
	}

	firstUpdated() {
		this.__chart = Highcharts.chart(this.__chartContainer, {
			chart: {
				type: 'line',
			},
			title: {
				text: 'The plot',
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
				this.__snackNoData.open()
			} else if (this.channelsWithoutData.length > 0) {
				this.__snackPartialData.open()
			}
		}
		if (changedProperties.has('requestFinishedAt')) {
			this.__chart.update({
				subtitle: {
					text: this.requestFinishedAt
						? `Data retrieved ${formatDate(this.requestFinishedAt)}`
						: '',
				},
			})
		}
		if (
			changedProperties.has('startTime') ||
			changedProperties.has('endTime')
		) {
			this.canPlot = this.__calcCanPlot()
		}
	}

	private __showQuickDial() {
		this.__quickDial.show()
	}

	private __quickDialClicked(e: Event) {
		this.endTime = Date.now()
		this.startTime =
			this.endTime - 1000 * Number.parseInt((e.target as ListItem).value)
	}

	private __quickDialToday() {
		this.endTime = Date.now()
		const d = new Date()
		d.setHours(0, 0, 0, 0)
		this.startTime = d.getTime()
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
			this.__snackBadTimeFormat.open()
			this.canPlot = false
			return
		}
		this.startTime = d
	}

	private __onEndTimeChanged(e: Event) {
		const txt = e.target as TextField
		const d = datefns.parseISO(txt.value).getTime()
		if (isNaN(d)) {
			txt.focus()
			this.__snackBadTimeFormat.open()
			this.canPlot = false
			return
		}
		this.endTime = d
	}

	render() {
		return html`
			<div id="queryrange">
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
				${this.__renderQuickDial()}
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
			<wl-progress-spinner ?hidden=${!this.fetching}></wl-progress-spinner>
			<div class="error" ?hidden=${!this.error}>
				There was an error:
				<p>${this.error ? this.error.message : ''}</p>
			</div>
			<wl-card id="chart" ?hidden="${!this.shouldDisplayChart}"></wl-card>
			<div id="meta">${this.__renderMeta()}</div>
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
		`
	}

	private __renderQuickDial(): TemplateResult {
		return html`
			<wl-popover id="quickdial" closeOnClick fixed anchor="#btnQuickDial">
				<wl-popover-card>
					<wl-list-item value="1" clickable @click="${this.__quickDialClicked}"
						>last 1s</wl-list-item
					>
					<wl-list-item value="10" clickable @click="${this.__quickDialClicked}"
						>last 10s</wl-list-item
					>
					<wl-list-item value="60" clickable @click="${this.__quickDialClicked}"
						>last 1m</wl-list-item
					>
					<wl-list-item
						value="600"
						clickable
						@click="${this.__quickDialClicked}"
						>last 10m</wl-list-item
					>
					<wl-list-item
						value="3600"
						clickable
						@click="${this.__quickDialClicked}"
						>last 1h</wl-list-item
					>
					<wl-list-item
						value="43200"
						clickable
						@click="${this.__quickDialClicked}"
						>last 12h</wl-list-item
					>
					<wl-list-item
						value="86400"
						clickable
						@click="${this.__quickDialClicked}"
						>last 1d</wl-list-item
					>
					<wl-list-item
						value="604800"
						clickable
						@click="${this.__quickDialClicked}"
						>last 7d</wl-list-item
					>
					<wl-list-item
						value="2592000"
						clickable
						@click="${this.__quickDialClicked}"
						>last 30d</wl-list-item
					>
					<wl-list-item
						value="31536000"
						clickable
						@click="${this.__quickDialClicked}"
						>last 365d</wl-list-item
					>
					<wl-divider></wl-divider>
					<wl-list-item clickable @click="${this.__quickDialToday}"
						>today</wl-list-item
					>
				</wl-popover-card>
			</wl-popover>
		`
	}

	private __renderMeta(): TemplateResult {
		if (this.requestDuration === undefined) return html``
		return html`
			<wl-expansion>
				<span slot="title">Meta</span>
				<span slot="description">Information about the query</span>
				<ul>
					<li>Number of channels in request: ${this.channels.length}</li>
					<li>Number of channels in response: ${this.response.length}</li>
					<li>
						Number of channels in response without data points:
						${this.channelsWithoutData.length}
					</li>
					<li>Duration of request: ${this.requestDuration / 1000} seconds</li>
					<li>
						Number of data points:
						<table>
							<tr>
								<th>Channel</th>
								<th>Data points</th>
							</tr>
							${this.response.map(
								item =>
									html`
										<tr>
											<td>${channelToId(item.channel)}</td>
											<td>${item.data.length}</td>
										</tr>
									`
							)}
						</table>
					</li>
				</ul>
			</wl-expansion>
		`
	}

	static get styles(): CSSResult {
		return css`
			:host {
				height: 100vh;
				padding: 8px;
				display: flex;
				flex-direction: column;
			}
			#queryrange {
				order: 0;
				flex-grow: 0;
				display: flex;
				align-items: center;
			}
			#queryrange * {
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
				width: 5rem;
				height: 5rem;
				margin: 8px auto;
			}
			wl-progress-spinner[hidden] {
				display: none;
			}
			wl-card[hidden] {
				display: none;
			}
			#chart {
				margin: 8px 0;
			}
			#meta {
				flex-grow: 0;
			}
			#meta:empty {
				display: none;
			}
			#chart {
				flex-grow: 1;
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
		`
	}
}
