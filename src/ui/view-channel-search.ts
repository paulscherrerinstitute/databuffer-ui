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
import 'weightless/progress-spinner'

import '@material/mwc-button'
import '@material/mwc-snackbar'
import type { Snackbar } from '@material/mwc-snackbar'
import '@material/mwc-textfield'
import type { TextField } from '@material/mwc-textfield'

import { store, RootState, RoutingActions } from '../store'
import { ChannelSearchSelectors } from '../store/channelsearch'
import type { ChannelWithTags } from '../store/channelsearch'
import { PlotActions } from '../store/plot'
import { TemplateResult } from 'lit-html'

import './channel-search-result-list'
import './channel-search-selected-list'
import { baseStyles } from './shared-styles'

const MAX_NUM_RESULTS = 100

@customElement('view-channel-search')
export class ChannelSearchElement extends connect(store, LitElement) {
	@property({ attribute: false }) pattern: string
	@property({ attribute: false }) searchResults: ChannelWithTags[]
	@property({ attribute: false }) fetching: boolean
	@property({ attribute: false }) error: Error

	@query('#query')
	private __query!: TextField

	@query('#notify-cutoff')
	private __notifyCutoff!: Snackbar

	mapState(state: RootState) {
		return {
			pattern: ChannelSearchSelectors.pattern(state),
			searchResults: ChannelSearchSelectors.resultsWithTags(state),
			fetching: ChannelSearchSelectors.fetching(state),
			error: ChannelSearchSelectors.error(state),
		}
	}

	mapEvents() {
		return {
			'search-click': (e: CustomEvent) =>
				RoutingActions.push(
					`/search?q=${encodeURIComponent(e.detail.pattern)}`
				),
		}
	}

	firstUpdated(): void {
		this.__query.updateComplete.then(() => {
			this.__query.focus()
		})
	}

	updated(changedProperties): void {
		// show notification if cut-off is done
		if (
			changedProperties.has('searchResults') &&
			this.searchResults.length > MAX_NUM_RESULTS
		) {
			this.__notifyCutoff.open()
		}
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

	private __plotSelected(): void {
		const e = new CustomEvent('channel-plot')
		this.dispatchEvent(e)
	}

	render(): TemplateResult {
		return html`
			<div id="search">
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
			<div id="results">
				${this.__resultsTemplate()}
			</div>
			<channel-search-selected-list></channel-search-selected-list>
			<mwc-snackbar
				id="notify-cutoff"
				labelText="Showing first ${MAX_NUM_RESULTS} results. Refine your
          search."
			></mwc-snackbar>
		`
	}

	private __resultsTemplate(): TemplateResult {
		if (!this.pattern) return html``
		if (this.fetching) return html`<wl-progress-spinner></wl-progress-spinner>`
		if (this.error)
			return html`
				<div class="error">
					There was an error:
					<p>${this.error.message}</p>
				</div>
			`
		return html`<channel-search-result-list
			.maxResults=${MAX_NUM_RESULTS}
		></channel-search-result-list>`
	}

	static get styles(): CSSResultArray {
		return [
			baseStyles,
			css`
				:host {
					height: 100%;
					overflow: hidden;
					display: grid;
					grid-template-columns: 100%;
					grid-template-rows: auto minmax(0, 1fr) minmax(0, 1fr);
					gap: 8px;
					padding: 8px;
				}

				#search {
					grid-row: 1;
					display: flex;
					flex-direction: row;
					flex-wrap: nowrap;
					align-items: center;
				}

				#search mwc-textfield {
					flex: 1 1 auto;
				}

				#search mwc-button {
					align-self: flex-end;
					margin: auto 0 auto 8px;
				}

				#results {
					grid-row: 2;
				}

				#selected {
					grid-row: 3;
				}

				.error {
					border: 2px solid rgba(127, 0, 0, 1);
					border-radius: 4px;
					margin: 4px;
					padding: 2rem;
					background-color: rgba(255, 200, 200, 0.3);
				}
			`,
		]
	}
}
