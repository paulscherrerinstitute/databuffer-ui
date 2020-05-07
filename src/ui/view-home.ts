import {
	LitElement,
	customElement,
	html,
	property,
	css,
	query,
} from 'lit-element'
import { connect } from '@captaincodeman/redux-connect-element'
import '@material/mwc-button'
import '@material/mwc-textfield'
import { TextField } from '@material/mwc-textfield'

import { store, RootState } from '../store'

import {
	ChannelSearchSelectors,
	ChannelSearchActions,
} from '../store/channelsearch'

@customElement('view-home')
export class HomeElement extends connect(store, LitElement) {
	@property({ attribute: false })
	pattern: string = ''

	@query('#query')
	private __query!: TextField

	mapState(state: RootState) {
		return {
			pattern: ChannelSearchSelectors.pattern(state),
		}
	}

	mapEvents() {
		return {
			'search-click': () => ChannelSearchActions.searchChannel(),
			'pattern-change': (e: CustomEvent<{ pattern: string }>) =>
				ChannelSearchActions.patternChange(e.detail.pattern),
		}
	}

	firstUpdated() {
		this.__query.updateComplete.then(() => this.__query.focus())
	}

	render() {
		return html`
			<div id="top">
				<div class="limit-width centered">
					<div id="logo">
						<img
							src="/icons/android-icon-192x192.png"
							alt="app logo"
						/><br />Databuffer UI
					</div>

					<mwc-textfield
						id="query"
						label="Search for EPICS channels"
						helper="Search supports regular expressions"
						@change=${() =>
							this.dispatchEvent(
								new CustomEvent('pattern-change', {
									detail: { pattern: this.__query.value },
								})
							)}
						@keyup=${(e: KeyboardEvent): void => {
							if (e.key === 'Enter') this.__search()
						}}
						value="${this.pattern}"
					></mwc-textfield>
					<mwc-button icon="search" raised @click=${this.__search}
						>Search</mwc-button
					>
				</div>
			</div>
			<div id="bottom">
				<div id="footer" class="limit-width">
					<mwc-icon>info</mwc-icon>
					<span>
						This is databuffer UI APP_VERSION_STRING.
						<a
							href="https://github.com/paulscherrerinstitute/databuffer-ui/blob/master/CHANGELOG.md"
							target="_blank"
							>View the changelog</a
						>
						for details about this version.
					</span>
					<mwc-icon>feedback</mwc-icon>
					<span>
						You can report issues or give feedback
						<a
							href="https://github.com/paulscherrerinstitute/databuffer-ui/issues/"
							>on GitHub</a
						>
						or
						<a href="mailto:daq@psi.ch?subject=Feedback%20on%20databuffer-ui"
							>by email</a
						>.
					</span>
				</div>
			</div>
		`
	}

	private __search(): void {
		if (!this.__query.value) return
		const e = new CustomEvent('search-click')
		this.dispatchEvent(e)
	}

	static get styles() {
		return [
			css`
				:host {
					display: flex;
					flex-direction: column;
					height: 100%;
				}

				.limit-width {
					max-width: 800px;
					margin: 0 auto;
				}

				.centered {
					text-align: center;
				}

				#logo {
					font-size: 12px;
					margin: 24px 0;
				}

				#query {
					margin: 24px 0;
					width: 100%;
				}

				#top {
					flex: 1;
				}

				#bottom {
					flex: 0;
					margin-top: 8rem;
					padding: 16px 0;
					font-size: 80%;
					background-color: hsl(0, 0%, 30%);
					color: hsl(0, 0%, 80%);
				}

				#bottom a,
				#bottom a:visited {
					color: var(--dui-secondary-light);
				}

				#footer {
					display: grid;
					grid-template-columns: auto 1fr;
					grid-template-rows: auto auto auto;
					gap: 8px;
					align-items: center;
				}
			`,
		]
	}
}
