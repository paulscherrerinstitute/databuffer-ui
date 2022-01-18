import { LitElement, customElement, html, state, css } from 'lit-element'

import { AppState, store } from '../../state/store'
import { PlotDataSeries, plotSelectors } from '../../state/models/plot'

import { baseStyles } from '../shared-styles'
import { connect } from '@captaincodeman/rdx'
import { channelToId } from '../../shared/channel'
import type { DataUiChannelState } from '../../shared/channel'

@customElement('view-channel-info')
export class ViewChannelInfoElement extends connect(store, LitElement) {
	@state() pendingRequests!: number
	@state() dataSeries!: PlotDataSeries[]

	mapState(state: AppState) {
		return {
			pendingRequests: plotSelectors.pendingRequests(state),
			dataSeries: plotSelectors.plotDataSeries(state),
		}
	}

	render() {
		if (this.pendingRequests > 0)
			return html`<p>Still ${this.pendingRequests} queries in progress</p>`
		return html`
			<table class="fullwidth text-small">
				<thead>
					<tr>
						<th>Channel</th>
						<th>Data type</th>
						<th>Data shape</th>
						<th>Unit</th>
						<th>Reduced?</th>
						<th>#plot points</th>
						<th>#data events</th>
						<th>Recording?</th>
						<th>Connected?</th>
						<th>Latest event</th>
					</tr>
				</thead>
				<tbody>
					${this.dataSeries.map((ds, idx) => {
						return html`<tr>
							<td>
								${channelToId(ds.channel)}<br /><span class="description"
									>${ds.channel.description}</span
								>
							</td>
							<td>${ds.channel.dataType}</td>
							<td>
								${ds.channel.dataType === 'string'
									? 'string'
									: ds.channel.dataShape}
							</td>
							<td>${ds.channel.unit}</td>
							<td>${ds.isReduced ? 'Y' : 'N'}</td>
							<td>${ds.datapoints?.length ?? ''}</td>
							<td>${ds.numDatapoints ?? ''}</td>
							<td>
								${ds.channel.channelState
									? ds.channel.channelState.recording
										? 'Y'
										: 'N'
									: '?'}
							</td>
							<td>
								${ds.channel.channelState
									? ds.channel.channelState.connected
										? 'Y'
										: 'N'
									: '?'}
							</td>
							<td>
								${ds.channel.channelState
									? ds.channel.channelState.latestEventDate
									: '?'}
							</td>
						</tr>`
					})}
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

				.text-small {
					font-size: 10pt;
				}

				.fullwidth {
					width: 100%;
				}

				.description {
					font-size: 75%;
					color: rgba(0, 0, 0, 0.7);
				}
			`,
		]
	}
}
