import {
	LitElement,
	html,
	css,
	CSSResultArray,
	PropertyValues,
	TemplateResult,
} from 'lit'
import { customElement, query, state } from 'lit/decorators.js'

import '@material/mwc-button'
import '@material/mwc-circular-progress'
import '@material/mwc-snackbar'
import type { Snackbar } from '@material/mwc-snackbar'
import '@material/mwc-textfield'
import type { TextField } from '@material/mwc-textfield'

import type { DataUiChannel } from '../../shared/channel'
import { AppState, store } from '../../state/store'
import { appcfgSelectors } from '../../state/models/appcfg'
import { channelsearchSelectors } from '../../state/models/channelsearch'

import '../components/channel-search-result-list'
import '../components/channel-search-selected-list'
import { baseStyles } from '../shared-styles'
import { connect } from '@captaincodeman/rdx'

const MAX_NUM_RESULTS = 100

@customElement('view-channel-search')
export class ChannelSearchElement extends connect(store, LitElement) {
	@state() canSearchChannels = false
	@state() pattern: string = ''
	@state() searchResults: DataUiChannel[] = []
	@state() fetching: boolean = false
	@state() error: Error | null = null

	@query('#query')
	private __query!: TextField

	@query('#notify-cutoff')
	private __notifyCutoff!: Snackbar

	mapState(state: AppState) {
		return {
			canSearchChannels: appcfgSelectors.canSearchChannels(state),
			pattern: channelsearchSelectors.pattern(state),
			searchResults: channelsearchSelectors.results(state),
			fetching: channelsearchSelectors.fetching(state),
			error: channelsearchSelectors.error(state),
		}
	}

	mapEvents() {
		return {
			// TODO: Check, if this actually ever fires...
			'nav-back': () => store.dispatch.routing.push('/'),
		}
	}

	firstUpdated(): void {
		this.__query.updateComplete.then(() => {
			this.__query.focus()
		})
	}

	updated(changedProperties: PropertyValues): void {
		// show notification if cut-off is done
		if (
			changedProperties.has('searchResults') &&
			this.searchResults.length > MAX_NUM_RESULTS
		) {
			this.__notifyCutoff.show()
		}
	}

	private __search(): void {
		if (!this.pattern) return
		store.dispatch.channelsearch.runSearch()
	}

	render(): TemplateResult {
		return html`
			<div id="search">
				<mwc-textfield
					id="query"
					label="Search Data API"
					helper="Search supports regular expressions"
					value="${this.pattern}"
					?disabled=${!this.canSearchChannels}
					@keyup=${(e: KeyboardEvent): void => {
						if (e.key === 'Enter') this.__search()
					}}
					@change=${() =>
						store.dispatch.channelsearch.patternChange(this.__query.value)}
				></mwc-textfield
				><mwc-button
					icon="search"
					raised
					?disabled=${!this.canSearchChannels}
					@click=${this.__search}
					>Search</mwc-button
				>
			</div>
			<div id="results">${this.__resultsTemplate()}</div>
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
		if (this.fetching)
			return html`<mwc-circular-progress indeterminate></mwc-circular-progress>`
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
