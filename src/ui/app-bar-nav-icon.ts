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
import { nothing } from 'lit-html'

import '@material/mwc-icon-button'

@customElement('app-bar-nav-icon')
export class AppBarNavIconElement extends connect(store, LitElement) {
	@property({ attribute: false }) page: string
	@property({ attribute: false }) destination: string = ''

	mapState(state: State) {
		return {
			page: state.routing.page,
		}
	}

	mapEvents() {
		return {
			click: () => store.dispatch.routing.push(this.destination),
		}
	}

	constructor() {
		super()
	}

	private destinationByPage = {
		search: `/`,
		plot: `/search`,
		'plot-settings': `/plot`,
		'query-meta': `/plot`,
	}

	shouldUpdate(changedProperties: PropertyValues) {
		if (changedProperties.has('page')) {
			this.destination = this.destinationByPage[this.page] ?? ''
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
