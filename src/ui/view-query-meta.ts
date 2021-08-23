import { LitElement, customElement, html, property, css } from 'lit-element'

import { formatDate } from '../util'
import { AppState, store } from '../state/store'
import { Channel, DataRequestMeta, plotSelectors } from '../state/models/plot'

import type { DataResponse } from '../api/queryrest'
import { baseStyles } from './shared-styles'
import { connect } from '@captaincodeman/rdx'
import { channelToId } from '../shared/channel'

@customElement('view-query-meta')
export class QueryMetaElement extends connect(store, LitElement) {
	@property({ attribute: false }) channels: Channel[] = []
	@property({ attribute: false }) pendingRequests!: number
	@property({ attribute: false }) dataRequests!: DataRequestMeta[]

	mapState(state: AppState) {
		return {
			channels: plotSelectors.channels(state),
			pendingRequests: plotSelectors.pendingRequests(state),
			dataRequests: plotSelectors.dataRequests(state),
		}
	}

	render() {
		if (this.pendingRequests > 0)
			return html`<p>Still ${this.pendingRequests} queries in progress</p>`
		return html`
			<h1>Summary</h1>
			<h2>HTTP requests</h2>
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
					${this.dataRequests.map(
						(r, idx) => html`<tr>
							<td>${channelToId(this.channels[idx])}</td>
							<td>${r.request.sentAt ? formatDate(r.request.sentAt) : ''}</td>
							<td>
								${r.request.finishedAt ? formatDate(r.request.finishedAt) : ''}
							</td>
							<td>
								${r.request.finishedAt && r.request.sentAt
									? (r.request.finishedAt - r.request.sentAt) / 1000 + ' sec'
									: ''}
							</td>
							<td>${r.error ? r.error.message : ''}</td>
							<td>${r.response.length > 0 ? r.response[0].data.length : ''}</td>
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
