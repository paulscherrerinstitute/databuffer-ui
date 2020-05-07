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
import { nothing, TemplateResult } from 'lit-html'

import '@material/mwc-icon-button'

@customElement('app-bar-action-items')
export class AppBarActionItemsElement extends connect(store, LitElement) {
	@property({ attribute: false }) pathname: string
	@property({ attribute: false }) templateResult: TemplateResult | {} = nothing

	mapState(state: RootState) {
		return {
			pathname: RoutingSelectors.pathname(state),
		}
	}

	mapEvents() {
		return {
			// 'plot:daterange': () => alert('plot:daterange'),
			// 'plot:share': () => PlotActions.sharePlot(),
			// 'plot:more': () => PlotActions.toggleMoreMenu(),
			// 'search:more': () => SearchActions.toggleMoreMenu(),
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
			action: () => nothing,
		},
		{
			path: '/search',
			action: () => html`<mwc-icon-button
				icon="more_vert"
				@click=${() => this.dispatchEvent(new CustomEvent('search:more'))}
			></mwc-icon-button>`,
		},
		{
			path: '/plot',
			action: () =>
				html`<mwc-icon-button
						icon="date_range"
						@click=${() =>
							this.dispatchEvent(new CustomEvent('plot:daterange'))}
					></mwc-icon-button
					><mwc-icon-button
						icon="print"
						@click=${() => this.dispatchEvent(new CustomEvent('plot:print'))}
					></mwc-icon-button
					><mwc-icon-button
						icon="share"
						@click=${() => this.dispatchEvent(new CustomEvent('plot:share'))}
					></mwc-icon-button
					><mwc-icon-button
						icon="more_vert"
						@click=${() => this.dispatchEvent(new CustomEvent('plot:more'))}
					></mwc-icon-button>`,
		},
	]

	shouldUpdate(changedProperties: PropertyValues) {
		if (changedProperties.has('pathname')) {
			this.router
				.resolve(this.pathname)
				.then(templateResult => {
					this.templateResult = templateResult
				})
				.catch(() => {
					this.templateResult = nothing
				})
		}
		return changedProperties.has('templateResult')
	}

	render() {
		return this.templateResult
	}

	static get styles() {
		return [baseStyles]
	}
}
