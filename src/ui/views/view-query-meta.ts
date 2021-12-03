import { LitElement, customElement, html, state, css } from 'lit-element'

import { formatDate } from '../../util'
import { AppState, store } from '../../state/store'
import { PlotDataSeries, plotSelectors } from '../../state/models/plot'

import { baseStyles } from '../shared-styles'
import { connect } from '@captaincodeman/rdx'
import { channelToId, DataUiChannel } from '../../shared/channel'

@customElement('view-query-meta')
export class QueryMetaElement extends connect(store, LitElement) {
	@state() channels: DataUiChannel[] = []
	@state() pendingRequests!: number
	@state() dataSeries!: PlotDataSeries[]

	mapState(state: AppState) {
		return {
			channels: plotSelectors.channels(state),
			pendingRequests: plotSelectors.pendingRequests(state),
			dataSeries: plotSelectors.plotDataSeries(state),
		}
	}

	render() {
		if (this.pendingRequests > 0)
			return html`<p>Still ${this.pendingRequests} queries in progress</p>`
		return html`
			<h1>Summary</h1>
			<h2>Data requests</h2>
			<table>
				<thead>
					<tr>
						<th>Channel</th>
						<th>Data type</th>
						<th>Data shape</th>
						<th>Reduced?</th>
						<th>#plot points</th>
						<th>#data events</th>
					</tr>
				</thead>
				<tbody>
					${this.dataSeries.map(
						x => html`<tr>
							<td>${channelToId(x.channel)}</td>
							<td>${x.channel.dataType}</td>
							<td>
								${x.channel.dataType === 'string'
									? 'string'
									: x.channel.dataShape}
							</td>
							<td>${x.isReduced ? 'Y' : 'N'}</td>
							<td>${x.datapoints?.length ?? ''}</td>
							<td>${x.numDatapoints ?? ''}</td>
						</tr>`
					)}
				</tbody>
			</table>
		`
	}

	static get styles() {
		return [
			baseStyles,
			css`
				:host {
					height: 100%;
					padding: 8px;
				}
			`,
		]
	}
}
