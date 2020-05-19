import { LitElement, customElement, html, property, css } from 'lit-element'

import { formatDate } from '../util'
import { RootState, store } from '../store'
import { Channel, PlotSelectors } from '../store/plot/'

import type { DataResponse } from '../api/queryrest'
import { baseStyles } from './shared-styles'
import { connect } from '@captaincodeman/redux-connect-element'

@customElement('view-query-meta')
export class QueryMetaElement extends connect(store, LitElement) {
	@property({ attribute: false }) channels: Channel[]
	@property({ attribute: false }) channelsWithoutData: Channel[]
	@property({ attribute: false }) error: Error
	@property({ attribute: false }) fetching: boolean
	@property({ attribute: false }) requestDuration: number
	@property({ attribute: false }) requestFinishedAt: number
	@property({ attribute: false }) response: DataResponse

	mapState(state: RootState) {
		return {
			channels: PlotSelectors.channels(state),
			channelsWithoutData: PlotSelectors.channelsWithoutData(state),
			error: PlotSelectors.error(state),
			fetching: PlotSelectors.fetching(state),
			requestDuration: PlotSelectors.requestDuration(state),
			requestFinishedAt: PlotSelectors.requestFinishedAt(state),
			response: PlotSelectors.response(state),
		}
	}

	render() {
		if (this.fetching) return html`<p>Query still in progress</p>`
		if (this.requestDuration === undefined)
			return html`<p>No query run, yet.</p>`
		return html`
			<h1>Summary</h1>
			<ul>
				<li>Request finished at: ${formatDate(this.requestFinishedAt)}</li>
				<li>Duration of request: ${this.requestDuration / 1000} seconds</li>
				<li>Number of channels in request: ${this.channels.length}</li>
				<li>Number of channels in response: ${this.response.length}</li>
				<li>
					Number of channels in response without data points:
					${this.channelsWithoutData.length}
				</li>
			</ul>
			<h2>Number of data points in the response</h2>
			<table>
				<tr>
					<th>Backend</th>
					<th>Channel</th>
					<th>Data points</th>
				</tr>
				${this.response.map(
					item =>
						html`
							<tr>
								<td>${item.channel.backend}</td>
								<td>${item.channel.name}</td>
								<td>${item.data.length}</td>
							</tr>
						`
				)}
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
