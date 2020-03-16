import {
	LitElement,
	customElement,
	html,
	property,
	css,
	query,
	CSSResultArray,
} from 'lit-element'
import { connect } from '@captaincodeman/redux-connect-element'

import 'weightless/expansion'
import 'weightless/list-item'
import 'weightless/progress-spinner'

import '@material/mwc-button'
import '@material/mwc-snackbar'
import { Snackbar } from '@material/mwc-snackbar'
import '@material/mwc-textfield'
import { TextField } from '@material/mwc-textfield'

import pluralize from 'pluralize'

import '@psi/daq-web-ui-components/daq-pill'
import { DaqPillSelectedEvent } from '@psi/daq-web-ui-components/daq-pill'
import '@psi/daq-web-ui-components/daq-pill-list'
import {
	DaqPillListElement,
	DaqPillListSelectedEvent,
} from '@psi/daq-web-ui-components/daq-pill-list'

import { store, RootState, RoutingActions } from '../store'
import {
	ChannelSearchSelectors,
	Channel,
	ChannelWithTags,
} from '../store/channelsearch'
import { nothing, TemplateResult } from 'lit-html'
import { PlotActions, PlotSelectors } from '../store/plot'

const MAX_NUM_RESULTS = 100

@customElement('view-channel-search')
export class ChannelSearchElement extends connect(store, LitElement) {
	@property({ type: String }) pattern: string
	@property({ type: Array }) searchResults: Channel[]
	@property({ type: Array }) resultsForDisplay: ChannelWithTags[]
	@property({ type: Boolean }) fetching: boolean
	@property({ type: Object }) error: Error
	@property({ type: Array }) availableFilters: string[] = []
	@property({ type: Array }) activeFilters: string[] = []
	@property({ attribute: false }) selectedChannels: Channel[] = []

	@query('#query')
	private __query!: TextField

	@query('#notify-cutoff')
	private __notifyCutoff!: Snackbar

	@query('#filterlist')
	private __filterList!: DaqPillListElement

	mapState(state: RootState) {
		return {
			pattern: ChannelSearchSelectors.pattern(state),
			searchResults: ChannelSearchSelectors.resultsWithTags(state),
			fetching: ChannelSearchSelectors.fetching(state),
			error: ChannelSearchSelectors.error(state),
			availableFilters: ChannelSearchSelectors.availableTags(state),
			selectedChannels: PlotSelectors.channels(state),
		}
	}

	mapEvents() {
		return {
			'search-click': (e: CustomEvent) =>
				RoutingActions.push(
					`/search?q=${encodeURIComponent(e.detail.pattern)}`
				),
			'channel-remove': (e: CustomEvent) =>
				PlotActions.unselectChannel(e.detail.index),
			'channel-select': (e: CustomEvent) =>
				PlotActions.selectChannel(e.detail.channel),
			'channel-plot-direct': (e: CustomEvent) =>
				RoutingActions.push(
					`/plot/${e.detail.channel.backend}/${e.detail.channel.name}`
				),
			'channel-plot': () => RoutingActions.push(`/plot`),
			'clear-selection': () => PlotActions.setSelectedChannels([]),
		}
	}

	firstUpdated(): void {
		this.__query.updateComplete.then(() => {
			this.__query.focus()
		})
	}

	updated(changedProperties): void {
		// re-calculate resultsForDisplay when either the search results or the filters have changed
		if (
			changedProperties.has('activeFilters') ||
			changedProperties.has('searchResults')
		) {
			this.__recalcResultsForDisplay()
		}
		// show notification if cut-off is done
		if (
			changedProperties.has('searchResults') &&
			this.searchResults.length > MAX_NUM_RESULTS
		) {
			this.__notifyCutoff.open()
		}
	}

	private __recalcResultsForDisplay() {
		this.resultsForDisplay = (this.activeFilters.length === 0
			? this.searchResults
			: this.searchResults.filter(x =>
					this.activeFilters.every(f => x.tags.indexOf(f) >= 0)
			  )
		).slice(0, MAX_NUM_RESULTS)
	}

	private __search(): void {
		const q = this.__query.value
		if (!q) return
		if (q === this.pattern) return
		const e = new CustomEvent('search-click', {
			detail: { pattern: q },
		})
		this.dispatchEvent(e)
	}

	private __onActiveFiltersChanged(e: DaqPillListSelectedEvent): void {
		this.activeFilters = e.detail.selected
	}

	private __plotSelected(): void {
		const e = new CustomEvent('channel-plot')
		this.dispatchEvent(e)
	}

	render(): TemplateResult {
		return html`
			<div id="search-top">
				<mwc-textfield
					id="query"
					label="Search for EPICS channels"
					helper="Search supports regular expressions"
					value="${this.pattern}"
					@keyup=${(e: KeyboardEvent): void => {
						if (e.key === 'Enter') this.__search()
					}}
				></mwc-textfield
				><mwc-button icon="search" raised @click=${this.__search}
					>Search</mwc-button
				>
			</div>
			<div id="filter">
				<h3>Filters</h3>
				${this.__filtersTemplate()}
			</div>
			<div id="results">
				<h3>Results</h3>
				${this.__resultsTemplate()}
			</div>
			${this.__selectedTemplate()}
			<mwc-snackbar
				id="notify-cutoff"
				labelText="Showing first ${MAX_NUM_RESULTS} results. Refine your
          search."
			></mwc-snackbar>
		`
	}

	private __filtersTemplate(): TemplateResult {
		return this.availableFilters.length === 0
			? html`
					<span class="nofilters">No filters available</span>
			  `
			: html`
					<daq-pill-list
						id="filterlist"
						selectable
						.selected=${this.activeFilters}
						.value=${this.availableFilters}
						@daq-pill-list-selected=${this.__onActiveFiltersChanged}
					></daq-pill-list>
			  `
	}

	private __resultsTemplate(): TemplateResult {
		if (!this.pattern) return html``
		if (this.fetching)
			return html`
				<wl-progress-spinner></wl-progress-spinner>
			`
		if (this.error)
			return html`
				<div class="error">
					There was an error:
					<p>${this.error.message}</p>
				</div>
			`
		return html`
			<p>
				${this.__numResultsTemplate()}
			</p>
			<div id="result-list">
				${this.resultsForDisplay.map(x => this.__resultItemTemplate(x))}
			</div>
		`
	}

	private __numResultsTemplate(): TemplateResult {
		return html`
			${pluralize('result', this.resultsForDisplay.length, true)}
			${this.resultsForDisplay.length < this.searchResults.length
				? html`
						(of ${this.searchResults.length})
				  `
				: nothing}
			for '${this.pattern}'
		`
	}

	private __resultItemTemplate(item: ChannelWithTags): TemplateResult {
		return html`
			<wl-list-item class="hide-buttons-until-hover">
				<div class="item-stuff" slot="after">
					<daq-pill-list
						selectable
						.selected=${this.activeFilters.filter(x => item.tags.includes(x))}
						.value=${item.tags}
						@daq-pill-selected=${this.__itemTagSelected}
						>${item.backend}</daq-pill-list
					>
					<mwc-icon-button
						class="small"
						icon="add"
						@click=${() =>
							this.dispatchEvent(
								new CustomEvent('channel-select', {
									detail: {
										// remove item.tags
										channel: { backend: item.backend, name: item.name },
									},
								})
							)}
						label="add channel to selection"
					></mwc-icon-button>
					<mwc-icon-button
						class="small"
						icon="show_chart"
						@click=${() =>
							this.dispatchEvent(
								new CustomEvent('channel-plot-direct', {
									detail: { channel: item },
								})
							)}
						label="plot channel directly without selecting"
					></mwc-icon-button>
				</div>
				<div class="channel-name">${item.name}</div>
				<div class="channel-description">${item.description}</div>
			</wl-list-item>
		`
	}

	private __itemTagSelected(e: DaqPillSelectedEvent): void {
		if (e.detail.selected) {
			this.__filterList.selectItem(e.detail.value)
		} else {
			this.__filterList.deselectItem(e.detail.value)
		}
	}

	private __selectedTemplate(): TemplateResult {
		return html`
			<div id="selected">
				<h3>Selected</h3>
				<div style="display:flex;margin-bottom:4px;align-items:center;">
					<span style="flex-grow:1"
						>Number: ${this.selectedChannels.length}</span
					><mwc-button
						icon="clear"
						@click=${() =>
							this.dispatchEvent(new CustomEvent('clear-selection'))}
						.disabled=${this.selectedChannels.length === 0}
						>Clear selection</mwc-button
					>
					<mwc-button
						icon="show_chart"
						raised
						@click=${this.__plotSelected}
						.disabled=${this.selectedChannels.length === 0}
						>Plot selected</mwc-button
					>
				</div>
				<div id="selected-list">
					${this.selectedChannels.map(
						(ch, idx) =>
							html`
								<wl-list-item class="hide-buttons-until-hover">
									<span slot="after">
										<mwc-icon-button
											class="small"
											icon="clear"
											@click=${() =>
												this.dispatchEvent(
													new CustomEvent('channel-remove', {
														detail: { index: idx },
													})
												)}
										></mwc-icon-button>
									</span>
									${ch.backend}/${ch.name} DEFAULT
								</wl-list-item>
							`
					)}
				</div>
			</div>
		`
	}

	static get styles(): CSSResultArray {
		return [
			// debugNesting,
			css`
				:host {
					display: flex;
					flex-direction: column;
					padding: 8px;
					box-sizing: border-box;
					height: 100vh;
				}

				#search-top {
					display: flex;
					flex-direction: row;
					flex-wrap: nowrap;
					align-items: center;
				}

				#search-top mwc-textfield {
					flex-grow: 1;
					flex-shrink: 1;
				}

				#search-top mwc-button {
					align-self: flex-end;
					margin: auto 0 auto 8px;
				}

				#results {
					flex-grow: 1;
					overflow: hidden;
					max-height: 50%;
					display: flex;
					flex-direction: column;
				}
				#result-list {
					border: 1px solid rgba(200, 200, 200, 0.3);
					overflow-y: scroll;
					flex-grow: 1;
					flex-shrink: 1;
				}
				#selected {
					flex-grow: 1;
					overflow: hidden;
					max-height: 50%;
					display: flex;
					flex-direction: column;
				}
				#selected mwc-button {
					margin: auto 0 auto 8px;
				}
				#selected-list {
					border: 1px solid rgba(200, 200, 200, 0.3);
					overflow-y: scroll;
					flex-grow: 1;
					flex-shrink: 1;
				}

				.error {
					border: 2px solid rgba(127, 0, 0, 1);
					border-radius: 4px;
					margin: 4px;
					padding: 2rem;
					background-color: rgba(255, 200, 200, 0.3);
				}

				.item-stuff {
					display: flex;
					align-items: center;
				}

				mwc-icon-button.small {
					--mdc-icon-size: 16px;
					--mdc-icon-button-size: 32px;
				}

				.hide-buttons-until-hover mwc-icon-button {
					opacity: 0%;
					margin-left: 8px;
					transition-property: opacity;
					transition-duration: 0.2s;
				}

				.hide-buttons-until-hover:hover mwc-icon-button {
					opacity: 100%;
					transition-property: opacity;
					transition-duration: 0.4s;
				}

				.channel-name {
					font-size: inherit;
				}
				.channel-description {
					font-size: 75%;
				}
			`,
		]
	}
}
