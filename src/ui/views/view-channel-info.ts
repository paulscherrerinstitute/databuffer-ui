import { LitElement, html, css } from 'lit'
import { customElement, state } from 'lit/decorators.js'

import { AppState, store } from '../../state/store'
import { PlotDataSeries, plotSelectors } from '../../state/models/plot'

import {
	baseStyles,
	colorHelpers,
	opacityHelpers,
	paddingHelpers,
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
		const headings = [
			'Channel',
			'Backend',
			'Data type',
			'Data shape',
			'Unit',
			'Reduced?',
			'#plot points',
			'#data events',
			'Recording?',
			'Connected?',
			'Configured?',
			'Latest event',
		]
		if (this.pendingRequests > 0)
			return html`<p>Still ${this.pendingRequests} queries in progress</p>`
		return html`
			<div id="list" class="fullwidth text-small">
				${headings.map(
					text => html`
						<div class="bg-primary fg-on-primary px-8 py-2 text-centered">
							${text}
						</div>
					`
				)}
				${this.dataSeries.map((ds, idx) => {
					return html`
						<div class="px-2">
							${ds.channel.name}<br /><span class="opacity-70 text-smallest"
								>${ds.channel.description}</span
							>
						</div>
						<div class="px-2">${ds.channel.backend}</div>
						<div class="px-2">${ds.channel.dataType}</div>
						<div class="px-2">
							${ds.channel.dataType === 'string'
								? 'string'
								: ds.channel.dataShape}
						</div>
						<div class="px-2">${ds.channel.unit}</div>
						<div class="px-2 text-centered">${formatBool(ds.isReduced)}</div>
						<div class="px-2 text-right">${ds.datapoints?.length ?? ''}</div>
						<div class="px-2 text-right">${ds.numDatapoints ?? ''}</div>
						<div class="px-2 text-centered">
							${formatBool(ds.channel.channelState?.recording)}
						</div>
						<div class="px-2 text-centered">
							${formatBool(ds.channel.channelState?.connected)}
						</div>
						<div class="px-2 text-centered">
							${formatBool(ds.channel.channelState?.configured)}
						</div>
						<div class="px-2">
							${ds.channel.channelState?.latestEventDate ?? '?'}
						</div>
					`
				})}
			</div>
		`
	}

	static get styles() {
		return [
			baseStyles,
			colorHelpers,
			textHelpers,
			opacityHelpers,
			paddingHelpers,
			sizeHelpers,
			css`
				:host {
					height: 100%;
					padding: 8px;
				}
				#list {
					margin-top: 8px;
					display: grid;
					grid-template-columns: 1fr auto auto auto auto auto auto auto auto auto auto auto;
					grid-template-rows: auto;
					gap: 2px;
					align-items: center;
				}
			`,
		]
	}
}
