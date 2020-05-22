import UniversalRouter from 'universal-router'
import {
	LitElement,
	customElement,
	html,
	property,
	PropertyValues,
} from 'lit-element'
import { connect } from '@captaincodeman/redux-connect-element'
import { store, RootState, RoutingSelectors, RoutingActions } from '../store'
import { baseStyles } from './shared-styles'
import { nothing, TemplateResult } from 'lit-html'

import '@material/mwc-icon-button'
import { PlotActions } from '../store/plot'

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
			'plot:daterange': () => PlotActions.toggleQueryRange(),
			'plot:info': () => RoutingActions.push('/query-meta'),
			'plot:settings': () => RoutingActions.push('/plot-settings'),
			'plot:share': () => PlotActions.showShareLink(),
		}
	}

	constructor() {
		super()
		this.router = new UniversalRouter(this.routes)
	}

	private router: UniversalRouter

	private routes = [
		{
			path: '/plot',
			action: () =>
				html`<mwc-icon-button
						icon="date_range"
						@click=${() =>
							this.dispatchEvent(new CustomEvent('plot:daterange'))}
					></mwc-icon-button
					><mwc-icon-button
						icon="share"
						@click=${() => this.dispatchEvent(new CustomEvent('plot:share'))}
					></mwc-icon-button
					><mwc-icon-button
						icon="settings"
						@click=${() => this.dispatchEvent(new CustomEvent('plot:settings'))}
					></mwc-icon-button
					><mwc-icon-button
						icon="info_outline"
						@click=${() => this.dispatchEvent(new CustomEvent('plot:info'))}
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
