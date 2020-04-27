import {
	LitElement,
	css,
	customElement,
	html,
	property,
	query,
} from 'lit-element'
import { connect } from '@captaincodeman/redux-connect-element'
import { store, RootState } from '../store'
import pluralize from 'pluralize'

import './channel-search-result-item'

import '@psi/databuffer-web-components/daq-pill'
import type { DaqPillSelectedEvent } from '@psi/databuffer-web-components/daq-pill'
import '@psi/databuffer-web-components/daq-pill-list'
import type {
	DaqPillListElement,
	DaqPillListSelectedEvent,
} from '@psi/databuffer-web-components/daq-pill-list'
import { ChannelSearchSelectors, ChannelWithTags } from '../store/channelsearch'
import { PlotSelectors, PlotActions } from '../store/plot'
import { nothing } from 'lit-html'

type Channel = {
	backend: string
	name: string
}

@customElement('channel-search-result-list')
export class ChannelSearchResultListElement extends connect(store, LitElement) {
	@property({ attribute: false }) pattern: string
	@property({ attribute: false }) searchResults: ChannelWithTags[] = []
	@property({ attribute: false }) resultsForDisplay: ChannelWithTags[] = []
	@property({ attribute: false }) error: Error
	@property({ attribute: false }) availableFilters: string[] = []
	@property({ attribute: false }) activeFilters: string[] = []
	@property({ attribute: false }) selectedChannels: Channel[] = []
	@property({ attribute: false }) maxResults: number = 0

	@query('#filterlist')
	private _filterList: DaqPillListElement

	public mapState(state: RootState) {
		return {
			pattern: ChannelSearchSelectors.pattern(state),
			searchResults: ChannelSearchSelectors.resultsWithTags(state),
			error: ChannelSearchSelectors.error(state),
			availableFilters: ChannelSearchSelectors.availableTags(state),
			selectedChannels: PlotSelectors.channels(state),
		}
	}

	public mapEvents() {
		return {
			'channel-remove': (e: CustomEvent) =>
				PlotActions.unselectChannel(e.detail.index),
			'channel-select': (e: CustomEvent) =>
				PlotActions.selectChannel(e.detail.channel),
		}
	}

	private _recalcResultsForDisplay() {
		this.resultsForDisplay = (this.activeFilters.length === 0
			? this.searchResults
			: this.searchResults.filter(x =>
					this.activeFilters.every(f => x.tags.indexOf(f) >= 0)
			  )
		).slice(0, this.maxResults)
	}

	updated(changedProperties): void {
		// re-calculate resultsForDisplay when either the search results or the filters have changed
		if (
			changedProperties.has('activeFilters') ||
			changedProperties.has('searchResults') ||
			changedProperties.has('maxResults')
		) {
			this._recalcResultsForDisplay()
		}
	}

	private _onSearchFilterChanged(e: DaqPillListSelectedEvent) {
		this.activeFilters = e.detail.selected
	}

	private _onItemFilterChanged(e: DaqPillSelectedEvent) {
		if (e.detail.selected) {
			this._filterList.selectItem(e.detail.value)
		} else {
			this._filterList.deselectItem(e.detail.value)
		}
	}

	private _renderFilters() {
		return this.availableFilters.length === 0
			? nothing
			: html`
					<daq-pill-list
						id="filterlist"
						selectable
						.selected=${this.activeFilters}
						.value=${this.availableFilters}
						@daq-pill-list-selected=${this._onSearchFilterChanged}
					></daq-pill-list>
			  `
	}

	private __numResultsTemplate() {
		return html`<div id="numresults">
			Showing ${pluralize('result', this.resultsForDisplay.length, true)}
			${this.resultsForDisplay.length < this.searchResults.length
				? html` (of ${this.searchResults.length}) `
				: nothing}
			for '${this.pattern}'
		</div>`
	}

	public _renderItems() {
		if (this.resultsForDisplay.length === 0) return nothing
		return html`<div id="list">
			${this.resultsForDisplay.map(item => {
				const selectedIndex = this.selectedChannels.findIndex(
					selected =>
						selected.name === item.name && selected.backend === item.backend
				)
				return html`<channel-search-result-item
					.item=${item}
					.selectedIndex=${selectedIndex}
					.activeFilters=${this.activeFilters}
					@daq-pill-selected=${this._onItemFilterChanged}
				></channel-search-result-item>`
			})}
		</div>`
	}

	public render() {
		return html`${this.__numResultsTemplate()} ${this._renderFilters()}
		${this._renderItems()}`
	}

	public static get styles() {
		return [
			css`
				:host {
					display: flex;
					flex-direction: column;
					height: 100%;
				}
				div,
				#filterlist {
					margin-top: 8px;
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
