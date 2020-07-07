import {
	LitElement,
	customElement,
	html,
	property,
	css,
	PropertyValues,
} from 'lit-element'
import { unsafeHTML } from 'lit-html/directives/unsafe-html'
import createMatcher from '@captaincodeman/router'
import type { Matcher } from '@captaincodeman/router'
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
		this.router = createMatcher(this.routes)
	}

	private router: Matcher

	private routes = {
		'/': `<view-home></view-home>`,
		'/search': `<view-channel-search></view-channel-search>`,
		'/plot': `<view-standard-plot></view-standard-plot>`,
		'/plot-settings': `<view-plot-settings></view-plot-settings>`,
		'/query-meta': `<view-query-meta></view-query-meta>`,
	}

	shouldUpdate(changedProperties: PropertyValues) {
		if (changedProperties.has('pathname')) {
			const v = this.router(this.pathname)
			this.view = v === null ? `<view-error></view-error>` : v.page
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
