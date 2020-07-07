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
import { store, RootState, RoutingSelectors } from '../store'
import { baseStyles } from './shared-styles'

@customElement('app-bar-title')
export class AppBarTitleElement extends connect(store, LitElement) {
	@property({ attribute: false }) pathname: string
	@property({ attribute: false }) title: string

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
		'/': `Databuffer UI`,
		'/search': `Search`,
		'/plot': `Plot`,
		'/plot-settings': `Plot settings`,
		'/query-meta': `About data query`,
	}

	shouldUpdate(changedProperties: PropertyValues) {
		if (changedProperties.has('pathname')) {
			const v = this.router(this.pathname)
			this.title = v === null ? `Databuffer UI` : v.page
		}
		return changedProperties.has('title')
	}

	render() {
		return this.title
	}

	static get styles() {
		return [baseStyles]
	}
}
