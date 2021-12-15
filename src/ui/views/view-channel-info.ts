import { LitElement, customElement, html, state, css } from 'lit-element'

import { formatDate } from '../../util'
import { AppState, store } from '../../state/store'
import { PlotDataSeries, plotSelectors } from '../../state/models/plot'

import { baseStyles } from '../shared-styles'
import { connect } from '@captaincodeman/rdx'
import { channelToId, DataUiChannel } from '../../shared/channel'

@customElement('view-channel-info')
export class ViewChannelInfoElement extends connect(store, LitElement) {
	@state() channels: DataUiChannel[] = []
	@state() pendingRequests!: number
	@state() dataSeries!: PlotDataSeries[]

	mapState(state: AppState) {
		return {
			pendingRequests: plotSelectors.pendingRequests(state),
			dataSeries: plotSelectors.plotDataSeries(state),
		}
	}

	render() {
		return html`<h1>Plot info</h1>
			${this.renderPlotInfo()}
			<h1>Dispatcher info</h1>
			${this.renderDispatcherInfo()}`
	}

	private renderPlotInfo() {
		if (this.pendingRequests > 0)
			return html`<p>Still ${this.pendingRequests} queries in progress</p>`
		return html`
			<table>
				<thead>
					<tr>
						<th>Channel</th>
						<th>Data type</th>
						<th>Data shape</th>
						<th>Unit</th>
						<th>Reduced?</th>
						<th>#plot points</th>
						<th>#data events</th>
					</tr>
				</thead>
				<tbody>
					${this.dataSeries.map(
						x => html`<tr>
							<td>${channelToId(x.channel)}<br />${x.channel.description}</td>
							<td>${x.channel.dataType}</td>
							<td>
								${x.channel.dataType === 'string'
									? 'string'
									: x.channel.dataShape}
							</td>
							<td>${x.channel.unit}</td>
							<td>${x.isReduced ? 'Y' : 'N'}</td>
							<td>${x.datapoints?.length ?? ''}</td>
							<td>${x.numDatapoints ?? ''}</td>
						</tr>`
					)}
				</tbody>
			</table>
		`
	}

	private renderDispatcherInfo() {
		return html`<p>Work in progress...</p>`
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