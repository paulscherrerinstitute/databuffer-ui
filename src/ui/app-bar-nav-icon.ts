import {
	LitElement,
	customElement,
	html,
	property,
	css,
	PropertyValues,
} from 'lit-element'
import createMatcher from '@captaincodeman/router'
import type { Matcher } from '@captaincodeman/router'
import { connect } from '@captaincodeman/redux-connect-element'
import { store, RootState, RoutingSelectors, RoutingActions } from '../store'
import { baseStyles } from './shared-styles'
import { nothing } from 'lit-html'

import '@material/mwc-icon-button'

@customElement('app-bar-nav-icon')
export class AppBarNavIconElement extends connect(store, LitElement) {
	@property({ attribute: false }) pathname: string
	@property({ attribute: false }) destination: string = ''

	mapState(state: RootState) {
		return {
			pathname: RoutingSelectors.pathname(state),
		}
	}

	mapEvents() {
		return {
			click: () => RoutingActions.push(this.destination),
		}
	}

	constructor() {
		super()
		this.router = createMatcher(this.routes)
	}

	private router: Matcher

	private routes = {
		'/search': `/`,
		'/plot': `/search`,
		'/plot-settings': `/plot`,
		'/query-meta': `/plot`,
	}

	shouldUpdate(changedProperties: PropertyValues) {
		if (changedProperties.has('pathname')) {
			const v = this.router(this.pathname)
			this.destination = v === null ? '' : v.page
		}
		return changedProperties.has('destination')
	}

	render() {
		if (!this.destination) return nothing
		return html`<mwc-icon-button icon="arrow_back"></mwc-icon-button>`
	}

	static get styles() {
		return [baseStyles]
	}
}
