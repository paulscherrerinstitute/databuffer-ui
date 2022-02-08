import { css, html, LitElement } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { connect } from '@captaincodeman/rdx'

import '@material/mwc-circular-progress'

import '../components/daq-range-select'
import '../components/daq-correlation-plot'
import type { PlotEventDetail } from '../components/daq-range-select'

import { store } from '../../state/store'
import type { AppState } from '../../state/store'
import {
	baseStyles,
	colorHelpers,
	opacityHelpers,
	paddingHelpers,
	shadowHelpers,
	sizeHelpers,
	textHelpers,
} from '../shared-styles'
import type { DataUiChannel } from '../../shared/channel'
import type { DataUiDataPoint } from '../../shared/dataseries'
import { correlationplotSelectors } from '../../state/models/correlationplot'
import { formatDate } from '../../util'

declare global {
	interface HTMLElementTagNameMap {
		'view-correlation-plot': ViewCorrelationPlotElement
	}
}

@customElement('view-correlation-plot')
export class ViewCorrelationPlotElement extends connect(store, LitElement) {
	@state() private channelX?: DataUiChannel
	@state() private channelY?: DataUiChannel
	@state() private startTime: number = Date.now() - 3_600_000
	@state() private endTime: number = Date.now()
	@state() private queryExpansion: boolean = false
	@state() private fetching: boolean = false
	@state() private error?: Error
	@state() private correlatedData?: DataUiDataPoint<number, number>[]

	mapState(state: AppState) {
		return {
			channelX: correlationplotSelectors.channelX(state),
			channelY: correlationplotSelectors.channelY(state),
			startTime: correlationplotSelectors.startTime(state),
			endTime: correlationplotSelectors.endTime(state),
			queryExpansion: correlationplotSelectors.queryExpansion(state),
			fetching: correlationplotSelectors.fetching(state),
			error: correlationplotSelectors.error(state),
			correlatedData: correlationplotSelectors.correlatedData(state),
		}
	}

	private _renderAxesGrid() {
		return html`<div id="axesgrid" class="shadow p-8 text-small">
			<div class="bg-primary fg-on-primary px-8 py-4 text-centered">Axis</div>
			<div class="bg-primary fg-on-primary px-8 py-4 text-centered">
				Channel
			</div>
			<div class="bg-primary fg-on-primary px-8 py-4 text-centered">
				Backend
			</div>
			<div class="p-4 text-centered">X</div>
			<div class="p-4">
				${this.channelX?.name}<br /><span class="text-smallest opacity-70"
					>${this.channelX?.description}</span
				>
			</div>
			<div class="p-4">${this.channelX?.backend}</div>
			<div class="p-4 text-centered">Y</div>
			<div class="p-4">
				${this.channelY?.name}<br /><span class="text-smallest opacity-70"
					>${this.channelY?.description}</span
				>
			</div>
			<div class="p-4">${this.channelY?.backend}</div>
		</div>`
	}

	render() {
		return html`
			${this._renderAxesGrid()}
			<daq-range-select
				class="shadow"
				.startTime=${this.startTime}
				.endTime=${this.endTime}
				.queryExpansion=${this.queryExpansion}
				@plot=${(e: CustomEvent<PlotEventDetail>) => {
					const { start, end, queryExpansion } = e.detail
					store.dispatch.correlationplot.setRange({ start, end })
					store.dispatch.correlationplot.setQueryExpansion(queryExpansion)
					store.dispatch.correlationplot.drawPlot()
				}}
			></daq-range-select>
			${this.fetching
				? html`<mwc-circular-progress indeterminate></mwc-circular-progress>`
				: html`<daq-correlation-plot
						.title=${formatDate(this.startTime) +
						' - ' +
						formatDate(this.endTime)}
						.subtitle=${`Number of data points: ${
							this.correlatedData?.length ?? 'n/a'
						}`}
						.xAxisTitle=${this.channelX?.name ?? ''}
						.yAxisTitle=${this.channelY?.name ?? ''}
						.data=${this.correlatedData?.map(pt => [pt.x, pt.y]) ?? []}
				  ></daq-correlation-plot>`}
		`
	}

	static get styles() {
		return [
			baseStyles,
			colorHelpers,
			opacityHelpers,
			paddingHelpers,
			shadowHelpers,
			sizeHelpers,
			textHelpers,
			css`
				:host {
					height: 100%;
					width: 100%;
					padding: 8px;
					display: grid;
					grid-template-columns: 1fr;
					gap: 8px;
					grid-template-rows: auto auto 1fr;
				}
				#axesgrid {
					display: grid;
					grid-template-columns: auto 1fr auto;
					gap: 2px;
				}
			`,
		]
	}
}
