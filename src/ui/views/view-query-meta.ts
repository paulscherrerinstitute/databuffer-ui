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
						<th>Request sent</th>
						<th>Request finished</th>
						<th>Request duration</th>
						<th>Error</th>
						<th>Number of data points</th>
					</tr>
				</thead>
				<tbody>
					${this.dataSeries.map(
						(x, idx) => html`<tr>
							<td>${channelToId(this.channels[idx])}</td>
							<td>${x.requestSentAt ? formatDate(x.requestSentAt) : ''}</td>
							<td>
								${x.requestFinishedAt ? formatDate(x.requestFinishedAt) : ''}
							</td>
							<td>
								${x.requestFinishedAt && x.requestSentAt
									? (x.requestFinishedAt - x.requestSentAt) / 1000 + ' sec'
									: ''}
							</td>
							<td>${x.error?.message ?? ''}</td>
							<td>${x.datapoints?.length ?? ''}</td>
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
