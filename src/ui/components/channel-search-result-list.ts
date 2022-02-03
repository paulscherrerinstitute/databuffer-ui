import { LitElement, css, html, nothing, PropertyValues } from 'lit'
import { customElement, query, state } from 'lit/decorators.js'
import { connect } from '@captaincodeman/rdx'
import { store, AppState } from '../../state/store'
import pluralize from 'pluralize'

import '@material/mwc-checkbox'
import type { Checkbox } from '@material/mwc-checkbox'

import '@paulscherrerinstitute/databuffer-web-components/daq-pill'
import type { DaqPillSelectedEvent } from '@paulscherrerinstitute/databuffer-web-components/daq-pill'
import '@paulscherrerinstitute/databuffer-web-components/daq-pill-list'
import type {
	DaqPillListElement,
	DaqPillListSelectedEvent,
} from '@paulscherrerinstitute/databuffer-web-components/daq-pill-list'
import { channelsearchSelectors } from '../../state/models/channelsearch'
import { plotSelectors } from '../../state/models/plot'
import { DataUiChannel } from '../../shared/channel'
import {
	mwcCheckboxPrimaryColor,
	opacityHelpers,
	textHelpers,
} from '../shared-styles'

@customElement('channel-search-result-list')
export class ChannelSearchResultListElement extends connect(store, LitElement) {
	@state() pattern: string = ''
	@state() searchResults: DataUiChannel[] = []
	@state() resultsForDisplay: DataUiChannel[] = []
	@state() error: Error | null = null
	@state() availableFilters: string[] = []
	@state() activeFilters: string[] = []
	@state() selectedChannels: DataUiChannel[] = []
	@state() maxResults: number = 0

	@query('#filterlist')
	private _filterList!: DaqPillListElement

	public mapState(state: AppState) {
		return {
			pattern: channelsearchSelectors.pattern(state),
			searchResults: channelsearchSelectors.results(state),
			error: channelsearchSelectors.error(state),
			availableFilters: channelsearchSelectors.availableTags(state),
			selectedChannels: plotSelectors.channels(state),
		}
	}

	private _recalcResultsForDisplay() {
		this.resultsForDisplay = (
			this.activeFilters.length === 0
				? this.searchResults
				: this.searchResults.filter(x =>
						this.activeFilters.every(f => (x.tags?.indexOf(f) ?? -1) >= 0)
				  )
		).slice(0, this.maxResults)
	}

	updated(changedProperties: PropertyValues): void {
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

	public _renderItems() {
		if (this.resultsForDisplay.length === 0) return nothing
		return html` <div id="list" class="fullwidth text-small">
			<div class="list-header">
				&nbsp;
				<!-- spacer; need nonbreaking space to render at full height like regular text -->
			</div>
			<div class="list-header">Channel</div>
			<div class="list-header">Backend</div>
			<div class="list-header">Data type</div>
			<div class="list-header">Data shape</div>
			<div class="list-header">Unit</div>
			${this.resultsForDisplay.map(item => {
				const selectedIndex = this.selectedChannels.findIndex(
					selected =>
						selected.name === item.name && selected.backend === item.backend
				)
				return this._renderItem(item, selectedIndex)
			})}
		</div>`
	}

	public render() {
		return html`${this.__numResultsTemplate()} ${this._renderFilters()}
		${this._renderItems()}`
	}

	public static get styles() {
		return [
			textHelpers,
			opacityHelpers,
			mwcCheckboxPrimaryColor,
			css`
				:host {
					display: flex;
					flex-direction: column;
					height: 100%;
				}
				#filterlist {
					margin-top: 8px;
				}
				#list {
					margin-top: 8px;
					border: 1px solid rgba(0, 0, 0, 0.54);
					overflow-y: scroll;
					display: grid;
					grid-template-columns: auto 1fr auto auto auto auto;
					grid-template-rows: auto;
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

				.fullwidth {
					width: 100%;
				}
			`,
		]
	}
}
