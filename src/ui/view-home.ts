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

import { store, RootState, RoutingActions } from '../store'

import { ChannelSearchSelectors } from '../store/channelsearch'

@customElement('view-home')
export class HomeElement extends connect(store, LitElement) {
	@property({ type: String })
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
			'search-click': (e: CustomEvent) =>
				RoutingActions.push(
					`/search?q=${encodeURIComponent(e.detail.pattern)}`
				),
		}
	}

	firstUpdated() {
		this.__query.updateComplete.then(() => this.__query.focus())
	}

	render() {
		return html`
			<div id="logo">DAQ Web UI</div>
			<p id="version">
				Version: APP_VERSION_STRING.
				<a
					href="https://github.com/paulscherrerinstitute/databuffer-ui/blob/master/CHANGELOG.md"
					target="_blank"
					>View changelog</a
				>
				for details.
			</p>

			<mwc-textfield
				id="query"
				label="Search for EPICS channels"
				helper="Search supports regular expressions"
				@keyup=${(e: KeyboardEvent): void => {
					if (e.key === 'Enter') this.__search()
				}}
				value="${this.pattern}"
			></mwc-textfield>
			<mwc-button icon="search" raised @click=${this.__search}
				>Search</mwc-button
			>
		`
	}

	private __search(): void {
		if (!this.__query.value) return
		const e = new CustomEvent('search-click', {
			detail: { pattern: this.__query.value },
		})
		this.dispatchEvent(e)
	}

	static get styles() {
		return [
			css`
				:host {
					display: flex;
					flex-direction: column;
					align-items: center;
					margin: 0 auto;
					max-width: 800px;
				}

				#logo {
					font-size: 76pt;
					margin: 24px 0;
				}

				#version {
					font-size: 8pt;
					margin: 0;
				}

				#query {
					margin: 24px 0;
					width: 100%;
				}
			`,
		]
	}
}
