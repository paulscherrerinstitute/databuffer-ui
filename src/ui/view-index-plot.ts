import { customElement, html, LitElement, state } from 'lit-element'
import { connect } from '@captaincodeman/rdx'

import { AppState, store } from '../state/store'
import { indexplotSelectors } from '../state/models/indexplot'
import { MinMax } from '../shared/dataseries'

@customElement('view-index-plot')
export class StandardPlotElement extends connect(store, LitElement) {
	@state()
	private timestamps: number[] = []

	@state()
	private minMax: MinMax[] = []

	@state()
	private dateStart: string = ''

	@state()
	private dateEnd: string = ''

	@state()
	private binItemCount: number = 0

	@state()
	private binCurrentItem: number = 0

	@state()
	private eventData: number[] = []

	public mapState(state: AppState) {
		return {
			timestamps: indexplotSelectors.timestamps(state),
			minMax: indexplotSelectors.envelope(state),
			dateStart: indexplotSelectors.dateStart(state),
			dateEnd: indexplotSelectors.dateEnd(state),
			binItemCount: indexplotSelectors.numEvents(state),
			binCurrentItem: indexplotSelectors.currentEventIndex(state),
			eventData: indexplotSelectors.eventData(state),
		}
	}

	public render() {
		return html`
			<table>
				<tr>
					<td>this.timestamps</td>
					<td>${JSON.stringify(this.timestamps)}</td>
				</tr>
				<tr>
					<td>this.minMax</td>
					<td>${JSON.stringify(this.minMax.length)} items</td>
				</tr>
				<tr>
					<td>this.dateStart</td>
					<td>${JSON.stringify(this.dateStart)}</td>
				</tr>
				<tr>
					<td>this.dateEnd</td>
					<td>${JSON.stringify(this.dateEnd)}</td>
				</tr>
				<tr>
					<td>this.binItemCount</td>
					<td>${JSON.stringify(this.binItemCount)}</td>
				</tr>
				<tr>
					<td>this.binCurrentItem</td>
					<td>${JSON.stringify(this.binCurrentItem)}</td>
				</tr>
				<tr>
					<td>this.eventData</td>
					<td>${this.eventData.length} items</td>
				</tr>
			</table>
		`
	}
}
