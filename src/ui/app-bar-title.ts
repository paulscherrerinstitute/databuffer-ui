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
		this.router = new UniversalRouter(this.routes)
	}

	private router: UniversalRouter

	private routes = [
		{
			path: '/',
			action: () => `Databuffer UI`,
		},
		{
			path: '/search',
			action: () => `Search`,
		},
		{
			path: '/plot',
			action: () => `Plot`,
		},
		{
			path: '/plot-settings',
			action: () => `Plot settings`,
		},
		{
			path: '/query-meta',
			action: () => `About data query`,
		},
	]

	shouldUpdate(changedProperties: PropertyValues) {
		if (changedProperties.has('pathname')) {
			this.router
				.resolve(this.pathname)
				.then(title => {
					this.title = title
				})
				.catch(() => {
					this.title = `Databuffer UI`
				})
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
