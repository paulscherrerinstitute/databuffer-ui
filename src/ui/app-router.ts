import UniversalRouter from 'universal-router'
import {
	LitElement,
	customElement,
	html,
	property,
	css,
	PropertyValues,
} from 'lit-element'
import { unsafeHTML } from 'lit-html/directives/unsafe-html'
import { connect } from '@captaincodeman/redux-connect-element'
import { store, RootState, RoutingSelectors } from '../store'
import { baseStyles } from './shared-styles'

@customElement('app-router')
export class AppRouterElement extends connect(store, LitElement) {
	@property({ type: String }) pathname: string
	@property({ type: String }) view: string

	mapState(state: RootState) {
		return {
			pathname: RoutingSelectors.pathname(state),
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
			action: () => `<view-home></view-home>`,
		},
		{
			path: '/search',
			action: () => `<view-channel-search></view-channel-search>`,
		},
		{
			path: '/plot',
			action: () => `<view-standard-plot></view-standard-plot>`,
		},
		{
			path: '/plot-settings',
			action: () => `<view-plot-settings></view-plot-settings>`,
		},
		{
			path: '/query-meta',
			action: () => `<view-query-meta></view-query-meta>`,
		},
	]

	shouldUpdate(changedProperties: PropertyValues) {
		if (changedProperties.has('pathname')) {
			this.router
				.resolve(this.pathname)
				.then(html => (this.view = html))
				.catch(error => (this.view = `<view-error>${error}</view-error>`))
		}
		return changedProperties.has('view')
	}

	render() {
		return html`${unsafeHTML(this.view)}`
	}

	static get styles() {
		return [
			baseStyles,
			css`
				:host {
					/* mwc-top-app-bar-fixed[dense] is 48px tall */
					height: calc(100vh - 48px);
				}
			`,
		]
	}
}
