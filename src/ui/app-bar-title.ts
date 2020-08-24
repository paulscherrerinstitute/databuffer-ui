import {
	LitElement,
	customElement,
	html,
	property,
	css,
	PropertyValues,
} from 'lit-element'
import { connect } from '@captaincodeman/rdx'
import { store, State } from '../state/store'
import { baseStyles } from './shared-styles'

@customElement('app-bar-title')
export class AppBarTitleElement extends connect(store, LitElement) {
	@property({ attribute: false }) page: string
	@property({ attribute: false }) title: string

	mapState(state: State) {
		return {
			page: state.routing.page,
		}
	}

	constructor() {
		super()
	}

	private titleByPage = {
		home: `Databuffer UI`,
		'channel-search': `Search`,
		plot: `Plot`,
		'plot-settings': `Plot settings`,
		'query-meta': `About data query`,
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
