import { LitElement, customElement, state, PropertyValues } from 'lit-element'
import { connect } from '@captaincodeman/rdx'
import { store, AppState } from '../state/store'
import { baseStyles } from './shared-styles'
import { ROUTE } from '../state/routing'

@customElement('app-bar-title')
export class AppBarTitleElement extends connect(store, LitElement) {
	@state() page: string = ''
	@state() title: string = ''

	mapState(state: AppState) {
		return {
			page: state.routing.page,
		}
	}

	constructor() {
		super()
	}

	private titleByPage: { [key: string]: string } = {
		[ROUTE.HOME]: ``,
		[ROUTE.CHANNEL_SEARCH]: `Search`,
		[ROUTE.PLOT]: `Plot`,
		[ROUTE.PLOT_SETTINGS]: `Plot settings`,
		[ROUTE.QUERY_META]: `About data query`,
	}

	shouldUpdate(changedProperties: PropertyValues) {
		if (changedProperties.has('page')) {
			const pageTitle = this.titleByPage[this.page] ?? ``
			this.title = pageTitle
				? `${window.DatabufferUi.TITLE} – ${pageTitle}`
				: window.DatabufferUi.TITLE
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
