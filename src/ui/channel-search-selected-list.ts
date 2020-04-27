import {
	LitElement,
	css,
	customElement,
	html,
	property,
	query,
} from 'lit-element'
import { connect } from '@captaincodeman/redux-connect-element'
import pluralize from 'pluralize'

import '@material/mwc-button'
import '@material/mwc-icon-button'
import 'weightless/list-item'

import './channel-search-selected-item'

import { store, RootState, RoutingActions } from '../store'
import { PlotSelectors, PlotActions } from '../store/plot'

type Channel = {
	backend: string
	name: string
}

@customElement('channel-search-selected-list')
export class ChannelSearchSelectedListElement extends connect(
	store,
	LitElement
) {
	@property({ attribute: false }) selectedChannels: Channel[] = []

	public mapState(state: RootState) {
		return {
			selectedChannels: PlotSelectors.channels(state),
		}
	}

	public mapEvents() {
		return {
			'clear-selection': () => PlotActions.setSelectedChannels([]),
			'channel-plot': () => RoutingActions.push(`/plot`),
			'channel-remove': (e: CustomEvent) =>
				PlotActions.unselectChannel(e.detail.index),
		}
	}

	public render() {
		return html`
			<div id="toprow">
				<span id="numselected">
					${pluralize('channel', this.selectedChannels.length, true)}
					selected</span
				><mwc-button
					icon="clear"
					@click=${() => this.dispatchEvent(new CustomEvent('clear-selection'))}
					.disabled=${this.selectedChannels.length === 0}
					>Clear selection</mwc-button
				>
				<mwc-button
					icon="show_chart"
					raised
					@click=${() => this.dispatchEvent(new CustomEvent('channel-plot'))}
					.disabled=${this.selectedChannels.length === 0}
					>Plot selected</mwc-button
				>
			</div>
			<div id="list">
				${this.selectedChannels.map(
					(ch, idx) =>
						html`<channel-search-selected-item
							.backend=${ch.backend}
							.name=${ch.name}
							@channel-search-selected-item:remove=${() =>
								this.dispatchEvent(
									new CustomEvent('channel-remove', {
										detail: { index: idx },
									})
								)}
						></channel-search-selected-item>`
				)}
			</div>
		`
	}

	public static get styles() {
		return [
			css`
				:host {
					display: flex;
					flex-direction: column;
					height: 100%;
				}
				#toprow {
					display: flex;
					flex-direction: row;
					align-items: center;
				}
				#numselected {
					flex: 1 1 auto;
				}
				mwc-button {
					margin: auto 0 auto 8px;
				}
				#list {
					margin-top: 8px;
					border: 1px solid rgba(0, 0, 0, 0.54);
					flex: 1 1 auto;
					overflow-y: scroll;
				}
			`,
		]
	}
}
