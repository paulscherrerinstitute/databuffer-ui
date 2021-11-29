import { css, customElement, html, LitElement, state } from 'lit-element'
import { connect } from '@captaincodeman/rdx'

import { AppState, store } from '../../state/store'
import { indexplotSelectors } from '../../state/models/indexplot'
import { MinMax } from '../../shared/dataseries'
import { formatDate } from '../../util'
import { baseStyles } from '../shared-styles'

import '../components/daq-index-plot'

@customElement('view-index-plot')
export class ViewIndexPlotElement extends connect(store, LitElement) {
	@state()
	channelId: string = ''

	@state()
	private timestamps: number[] = []

	@state()
	private minMax: MinMax[] = []

	@state()
	private binItemCount: number = 0

	@state()
	private binCurrentItem: number = 0

	@state()
	private eventData: number[] = []

	public mapState(state: AppState) {
		return {
			channelId: indexplotSelectors.channelId(state),
			timestamps: indexplotSelectors.timestamps(state),
			minMax: indexplotSelectors.envelope(state),
			binItemCount: indexplotSelectors.numEvents(state),
			binCurrentItem: indexplotSelectors.currentEventIndex(state),
			eventData: indexplotSelectors.eventData(state),
		}
	}

	public render() {
		return html`
			<div id="chart">
				<daq-index-plot
					.title=${this.channelId}
					.subtitle=${formatDate(this.timestamps[this.binCurrentItem]) +
					` (event ${this.binCurrentItem + 1} / ${this.binItemCount})`}
					xMin="0"
					.xMax=${this.minMax?.length ?? 0}
					.envelopeCurve=${this.minMax}
					.rawData=${this.eventData}
				></daq-index-plot>
			</div>
		`
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
				[hidden] {
					display: none;
				}
				#chart {
					height: 100%;
				}
			`,
		]
	}
}
