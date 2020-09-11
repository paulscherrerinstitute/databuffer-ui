import {
	LitElement,
	customElement,
	property,
	PropertyValues,
} from 'lit-element'
import { connect } from '@captaincodeman/rdx'
import { store, AppState } from '../state/store'
import { baseStyles } from './shared-styles'
import { ROUTE } from '../state/routing'

@customElement('app-bar-title')
export class AppBarTitleElement extends connect(store, LitElement) {
	@property({ attribute: false }) page: string = ''
	@property({ attribute: false }) title: string = ''

	mapState(state: AppState) {
		return {
			page: state.routing.page,
		}
	}

	constructor() {
		super()
	}

	private titleByPage: { [key: string]: string } = {
		[ROUTE.HOME]: `Databuffer UI`,
		[ROUTE.CHANNEL_SEARCH]: `Search`,
		[ROUTE.PLOT_SETTINGS]: `Plot`,
		[ROUTE.PLOT_SETTINGS]: `Plot settings`,
		[ROUTE.QUERY_META]: `About data query`,
	}

	shouldUpdate(changedProperties: PropertyValues) {
		if (changedProperties.has('page')) {
			this.title = this.titleByPage[this.page] ?? `Databuffer UI`
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
