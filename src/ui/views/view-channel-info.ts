import { LitElement, html, css } from 'lit'
import { customElement, state } from 'lit/decorators.js'

import { AppState, store } from '../../state/store'
import { PlotDataSeries, plotSelectors } from '../../state/models/plot'

import {
	baseStyles,
	opacityHelpers,
	sizeHelpers,
	textHelpers,
} from '../shared-styles'
import { connect } from '@captaincodeman/rdx'
import { channelToId } from '../../shared/channel'

function formatBool(
	val: boolean | undefined,
	opts: { valIfTrue: string; valIfFalse: string; valIfUndefined: string } = {
		valIfFalse: 'N',
		valIfTrue: 'Y',
		valIfUndefined: '?',
	}
): string {
	const { valIfFalse, valIfTrue, valIfUndefined } = opts
	if (val === undefined) return valIfUndefined
	return val ? valIfTrue : valIfFalse
}

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
						<th>Configured?</th>
						<th>Latest event</th>
					</tr>
				</thead>
				<tbody>
					${this.dataSeries.map((ds, idx) => {
						return html`<tr>
							<td>
								${channelToId(ds.channel)}<br /><span
									class="opacity-70 text-smallest"
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
							<td class="text-centered">${formatBool(ds.isReduced)}</td>
							<td class="text-right">${ds.datapoints?.length ?? ''}</td>
							<td class="text-right">${ds.numDatapoints ?? ''}</td>
							<td class="text-centered">
								${formatBool(ds.channel.channelState?.recording)}
							</td>
							<td class="text-centered">
								${formatBool(ds.channel.channelState?.connected)}
							</td>
							<td class="text-centered">
								${formatBool(ds.channel.channelState?.configured)}
							</td>
							<td>${ds.channel.channelState?.latestEventDate ?? '?'}</td>
						</tr>`
					})}
				</tbody>
			</table>
		`
	}

	static get styles() {
		return [
			baseStyles,
			textHelpers,
			opacityHelpers,
			sizeHelpers,
			css`
				:host {
					height: 100%;
					padding: 8px;
				}
			`,
		]
	}
}
