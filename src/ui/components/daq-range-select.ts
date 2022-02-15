import '@material/mwc-textfield'
import type { TextField } from '@material/mwc-textfield'
import '@material/mwc-formfield'
import '@material/mwc-switch'
import type { Switch } from '@material/mwc-switch'
import { parseISO } from 'date-fns'
import { LitElement, css, html, PropertyValues, nothing } from 'lit'
import { customElement, property, query, state } from 'lit/decorators.js'

import './daq-range-quickdial.js'
import type { DaqRangeSelectedEvent } from './daq-range-quickdial.js'

import { formatDate, TimeRange } from '../../util'
import { baseStyles } from '../shared-styles'

const TIMESTAMP_PATTERN = `^\\d{4}-\\d{2}-\\d{2}[ T]\\d{2}:\\d{2}:\\d{2}\\.\\d{3}$`
const TIMESTAMP_REGEX = new RegExp(TIMESTAMP_PATTERN)

export type PlotEventDetail = {
	start: number
	end: number
	queryExpansion: boolean
}

declare global {
	interface HTMLElementTagNameMap {
		'daq-range-select': DaqRangeSelectElement
	}
}

@customElement('daq-range-select')
export class DaqRangeSelectElement extends LitElement {
	@state() canPlot: boolean = false

	@property({ type: Number })
	startTime: number = 1

	@property({ type: Number })
	endTime: number = 2

	@property({ type: Boolean })
	queryExpansion: boolean = false

	@property({ type: Boolean })
	hideQueryExpansion: boolean = false

	@query('#starttime')
	private __txtStartTime!: TextField

	@query('#endtime')
	private __txtEndTime!: TextField

	private __calcCanPlot(): boolean {
		if (this.__txtStartTime === null) return false
		if (TIMESTAMP_REGEX.test(this.__txtStartTime.value) === false) return false
		if (this.__txtEndTime === null) return false
		if (TIMESTAMP_REGEX.test(this.__txtEndTime.value) === false) return false
		return true
	}
	private _dispatchStartChanged() {
		const event = new CustomEvent<{ time: number }>('startchanged', {
			bubbles: true,
			composed: true,
			detail: { time: this.startTime },
		})
		this.dispatchEvent(event)
	}

	private _dispatchEndChanged() {
		const event = new CustomEvent<{ time: number }>('endchanged', {
			bubbles: true,
			composed: true,
			detail: { time: this.endTime },
		})
		this.dispatchEvent(event)
	}

	private _dispatchQueryExpansion() {
		const event = new CustomEvent<{ enabled: boolean }>('queryexpansion', {
			bubbles: true,
			composed: true,
			detail: { enabled: this.queryExpansion },
		})
		this.dispatchEvent(event)
	}

	private _dispatchPlot() {
		const event = new CustomEvent<PlotEventDetail>('plot', {
			bubbles: true,
			composed: true,
			detail: {
				start: this.startTime,
				end: this.endTime,
				queryExpansion: this.queryExpansion,
			},
		})
		this.dispatchEvent(event)
	}

	private __onStartTimeChanged(e: Event) {
		const txt = e.target as TextField
		const d = parseISO(txt.value).getTime()
		if (isNaN(d)) {
			txt.focus()
			this.dispatchEvent(new CustomEvent('badtimeformat'))
			this.canPlot = false
			return
		}
		this.startTime = d
		this._dispatchStartChanged()
	}

	private __onEndTimeChanged(e: Event) {
		const txt = e.target as TextField
		const d = parseISO(txt.value).getTime()
		if (isNaN(d)) {
			txt.focus()
			this.dispatchEvent(new CustomEvent('badtimeformat'))
			this.canPlot = false
			return
		}
		this.endTime = d
		this._dispatchEndChanged()
	}

	private __setTimeRange(range: TimeRange) {
		this.startTime = range.start
		this.endTime = range.end
		this._dispatchStartChanged()
		this._dispatchEndChanged()
	}

	firstUpdated() {
		this.canPlot = this.__calcCanPlot()
	}

	updated(changedProperties: PropertyValues): void {
		if (
			changedProperties.has('startTime') ||
			changedProperties.has('endTime')
		) {
			this.canPlot = this.__calcCanPlot()
		}
	}

	render() {
		return html`
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
					<daq-range-quickdial
						@daq-range-selected=${(e: DaqRangeSelectedEvent) =>
							this.__setTimeRange(e.detail)}
					></daq-range-quickdial>
					${this.hideQueryExpansion
						? nothing
						: html`
								<mwc-formfield label="query expansion">
									<mwc-switch
										?selected=${this.queryExpansion}
										@click=${(e: Event) => {
											if (e.target === null) return
											const val = (e.target as Switch).selected
											this.queryExpansion = val
											this._dispatchQueryExpansion()
										}}
									></mwc-switch>
								</mwc-formfield>
						  `}
					<mwc-button
						@click=${() => this._dispatchPlot()}
						?disabled=${!this.canPlot}
						icon="show_chart"
						label="plot"
						raised
					></mwc-button>
				</div>
			</div>
		`
	}

	static get styles() {
		return [
			baseStyles,
			css`
				:host {
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
					display: inline-flex;
					flex-direction: row;
					align-items: center;
				}
			`,
		]
	}
}
