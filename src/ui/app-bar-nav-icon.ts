import UniversalRouter from 'universal-router'
import {
	LitElement,
	customElement,
	html,
	property,
	css,
	PropertyValues,
} from 'lit-element'
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
		this.router = new UniversalRouter(this.routes)
	}

	private router: UniversalRouter

	private routes = [
		{
			path: '/',
			action: () => ``,
		},
		{
			path: '/search',
			action: () => `/`,
		},
		{
			path: '/plot',
			action: () => `/search`,
		},
		{
			path: '/query-meta',
			action: () => `/plot`,
		},
	]

	shouldUpdate(changedProperties: PropertyValues) {
		if (changedProperties.has('pathname')) {
			this.router
				.resolve(this.pathname)
				.then(destination => {
					this.destination = destination
				})
				.catch(() => {
					this.destination = ''
				})
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
