import { LitElement, css, html, nothing } from 'lit'
import type { PropertyValues } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { repeat } from 'lit/directives/repeat.js'
import { connect } from '@captaincodeman/rdx'
import pluralize from 'pluralize'

import '@material/mwc-button'
import '@material/mwc-checkbox'
import type { Checkbox } from '@material/mwc-checkbox'

import { store, AppState } from '../../state/store'
import { plotSelectors } from '../../state/models/plot'
import { channelToId, DataUiChannel } from '../../shared/channel'
import {
	flexHelpers,
	mwcCheckboxPrimaryColor,
	sizeHelpers,
	textHelpers,
} from '../shared-styles'

@customElement('channel-search-selected-list')
export class ChannelSearchSelectedListElement extends connect(
	store,
	LitElement
) {
	@state() selectedChannels: DataUiChannel[] = []
	@state() canCorrelate: boolean = false

	public mapState(state: AppState) {
		return {
			selectedChannels: plotSelectors.channels(state),
		}
	}

	public mapEvents() {
		return {
			'clear-selection': () => store.dispatch.plot.setSelectedChannels([]),
			'channel-plot': () => store.dispatch.routing.push(`/plot`),
			'correlation-plot': () => {
				const channelX = this.selectedChannels[0]
				const channelY = this.selectedChannels[1]
				store.dispatch.correlationplot.selectChannels({ channelX, channelY })
				store.dispatch.routing.push(`/correlation-plot`)
			},
		}
	}

	updated(changedProperties: PropertyValues) {
		if (changedProperties.has('selectedChannels')) {
			this.canCorrelate = this._calcCanCorrelate()
		}
	}

	private _calcCanCorrelate() {
		if (this.selectedChannels.length !== 2) return false
		for (const ch of this.selectedChannels) {
			if (ch.dataType === 'string') return false
			if (ch.dataType === 'bool') return false
			if (ch.dataShape !== 'scalar') return false
		}
		return true
	}

	private _renderItem(item: DataUiChannel, selectedIndex: number) {
		return html`
			<div>
				<mwc-checkbox
					?checked=${selectedIndex !== -1}
					@change=${(e: Event) => {
						const cb = e.target as Checkbox
						if (cb.checked) {
							store.dispatch.plot.selectChannel(item)
						} else {
							store.dispatch.plot.unselectChannel(selectedIndex)
						}
					}}
				></mwc-checkbox>
			</div>
			<div>
				${item.name}${item.description
					? html`<br /><span class="opacity-70 text-smallest"
								>${item.description}</span
							>`
					: nothing}
			</div>
			<div>${item.backend}</div>
			<div>${item.dataType}</div>
			<div>${item.dataType === 'string' ? 'string' : item.dataShape}</div>
			<div>${item.unit}</div>
		`
	}

	public render() {
		return html`
			<div id="list" class="fullwidth text-small flex-grow flex-shrink">
				<div class="list-header">
					&nbsp;
					<!-- spacer; need nonbreaking space to render at full height like regular text -->
				</div>
				<div class="list-header">Channel</div>
				<div class="list-header">Backend</div>
				<div class="list-header">Data type</div>
				<div class="list-header">Data shape</div>
				<div class="list-header">Unit</div>
				${repeat(
					this.selectedChannels,
					ch => channelToId(ch),
					(ch, idx) => this._renderItem(ch, idx)
				)}
			</div>
			<div id="bottomrow" class="flex-row">
				<span class="flex-grow flex-shring">
					${pluralize('channel', this.selectedChannels.length, true)}
					selected</span
				><mwc-button
					icon="clear"
					@click=${() => this.dispatchEvent(new CustomEvent('clear-selection'))}
					.disabled=${this.selectedChannels.length === 0}
					>Clear selection</mwc-button
				>
				<mwc-button
					icon="scatter_plot"
					raised
					@click=${() => this.dispatchEvent(new Event('correlation-plot'))}
					?disabled=${!this.canCorrelate}
					>Correlation</mwc-button
				>
				<mwc-button
					icon="show_chart"
					raised
					@click=${() => this.dispatchEvent(new CustomEvent('channel-plot'))}
					?disabled=${this.selectedChannels.length === 0}
					>Plot</mwc-button
				>
			</div>
		`
	}

	public static get styles() {
		return [
			flexHelpers,
			textHelpers,
			sizeHelpers,
			mwcCheckboxPrimaryColor,
			css`
				:host {
					display: flex;
					flex-direction: column;
					height: 100%;
				}
				#bottomrow {
					margin-top: 8px;
					align-items: center;
				}
				mwc-button {
					margin: auto 0 auto 8px;
				}
				#list {
					border: 1px solid rgba(0, 0, 0, 0.54);
					overflow-y: scroll;
					display: grid;
					grid-template-columns: auto 1fr auto auto auto auto;
					grid-template-rows: max-content;
					grid-auto-rows: max-content;
					gap: 2px;
					align-items: center;
				}
				#list > div {
					padding-left: 4px;
					padding-right: 4px;
				}
				.list-header {
					text-align: center;
					background-color: var(--dui-primary);
					color: var(--dui-on-primary);
					padding: 4px 8px;
				}
			`,
		]
	}
}
