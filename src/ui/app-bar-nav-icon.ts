import { LitElement, html, nothing, PropertyValues } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { connect } from '@captaincodeman/rdx'
import { store, AppState } from '../state/store'
import { baseStyles } from './shared-styles'

import '@material/mwc-icon-button'
import { ROUTE } from '../state/routing'

@customElement('app-bar-nav-icon')
export class AppBarNavIconElement extends connect(store, LitElement) {
	@state() page: string = ''
	@state() destination: string = ''

	mapState(state: AppState) {
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

	private destinationByPage: { [key: string]: string } = {
		[ROUTE.CHANNEL_INFO]: `/plot`,
		[ROUTE.CHANNEL_SEARCH]: `/`,
		[ROUTE.CORRELATION_PLOT]: `/search`,
		[ROUTE.INDEX_PLOT]: `/plot`,
		[ROUTE.PLOT]: `/search`,
		[ROUTE.PLOT_SETTINGS]: `/plot`,
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
