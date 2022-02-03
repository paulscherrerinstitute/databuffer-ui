import { css, html, LitElement } from 'lit'
import { customElement, query } from 'lit/decorators.js'
import '@material/mwc-icon-button'
import type { IconButton } from '@material/mwc-icon-button'
import '@material/mwc-list/mwc-list-item'
import '@material/mwc-menu'
import type { Menu } from '@material/mwc-menu'

import { subDays, subMonths, subWeeks } from 'date-fns'

import {
	DAY,
	HOUR,
	MINUTE,
	TimeRange,
	timeRangeDay,
	timeRangeMonth,
	timeRangeWeek,
} from '../../util'

export type DaqRangeSelectedEvent = CustomEvent<TimeRange>

declare global {
	interface DocumentEventMap {
		'daq-range-selected': DaqRangeSelectedEvent
	}

	interface HTMLElementTagNameMap {
		'daq-range-quickdial': DaqRangeQuickdialElement
	}
}

@customElement('daq-range-quickdial')
export class DaqRangeQuickdialElement extends LitElement {
	@query('#button')
	private button!: IconButton

	@query('#menu')
	private menu!: Menu

	private quickDialRelative(durationMsec: number) {
		const end = Date.now()
		const start = end - durationMsec
		this.emitEventSelected({ start, end })
	}

	private quickDialYesterday() {
		const range = timeRangeDay(subDays(new Date(), 1).getTime())
		this.emitEventSelected(range)
	}

	private quickDialToday() {
		const range = timeRangeDay(Date.now())
		this.emitEventSelected(range)
	}

	private quickDialLastWeek() {
		const range = timeRangeWeek(subWeeks(new Date(), 1).getTime())
		this.emitEventSelected(range)
	}

	private quickDialThisWeek() {
		const range = timeRangeWeek(Date.now())
		this.emitEventSelected(range)
	}

	private quickDialLastMonth() {
		const range = timeRangeMonth(subMonths(new Date(), 1).getTime())
		this.emitEventSelected(range)
	}

	private quickDialThisMonth() {
		const range = timeRangeMonth(Date.now())
		this.emitEventSelected(range)
	}

	private emitEventSelected(range: TimeRange) {
		const evt: DaqRangeSelectedEvent = new CustomEvent('daq-range-selected', {
			bubbles: true,
			composed: true,
			detail: range,
		})
		this.dispatchEvent(evt)
	}

	protected firstUpdated() {
		this.menu.anchor = this.button
	}

	render() {
		return html`
			<div style="position:relative;">
				<mwc-icon-button
					id="button"
					@click="${() => this.menu.show()}"
					icon="more_horiz"
					label="quick-dial"
				></mwc-icon-button>
				<mwc-menu id="menu">
					<mwc-list-item @click=${() => this.quickDialRelative(1 * MINUTE)}
						>last 1m</mwc-list-item
					>
					<mwc-list-item @click=${() => this.quickDialRelative(10 * MINUTE)}
						>last 10m</mwc-list-item
					>
					<mwc-list-item @click=${() => this.quickDialRelative(1 * HOUR)}
						>last 1h</mwc-list-item
					>
					<mwc-list-item @click=${() => this.quickDialRelative(12 * HOUR)}
						>last 12h</mwc-list-item
					>
					<mwc-list-item @click=${() => this.quickDialRelative(24 * HOUR)}
						>last 24h</mwc-list-item
					>
					<mwc-list-item @click=${() => this.quickDialRelative(7 * DAY)}
						>last 7d</mwc-list-item
					>
					<li divider role="separator"></li>
					<mwc-list-item @click=${() => this.quickDialYesterday()}
						>yesterday</mwc-list-item
					>
					<mwc-list-item @click=${() => this.quickDialToday()}
						>today</mwc-list-item
					>
					<mwc-list-item @click=${() => this.quickDialLastWeek()}
						>last week</mwc-list-item
					>
					<mwc-list-item @click=${() => this.quickDialThisWeek()}
						>this week</mwc-list-item
					>
					<mwc-list-item @click=${() => this.quickDialLastMonth()}
						>last month</mwc-list-item
					>
					<mwc-list-item @click=${() => this.quickDialThisMonth()}
						>this month</mwc-list-item
					>
				</mwc-menu>
			</div>
		`
	}

	static get styles() {
		return [
			css`
				#quickdial {
					max-height: 80vh;
				}
			`,
		]
	}
}
