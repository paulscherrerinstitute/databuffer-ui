import {
	LitElement,
	customElement,
	html,
	state,
	PropertyValues,
} from 'lit-element'
import { connect } from '@captaincodeman/rdx'
import { store, AppState } from '../state/store'
import { baseStyles } from './shared-styles'
import { nothing, TemplateResult } from 'lit-html'

import '@material/mwc-icon-button'
import { ROUTE } from '../state/routing'

@customElement('app-bar-action-items')
export class AppBarActionItemsElement extends connect(store, LitElement) {
	@state() page: string = ''
	@state() templateResult: TemplateResult | typeof nothing = nothing

	mapState(state: AppState) {
		return {
			page: state.routing.page,
		}
	}

	mapEvents() {
		return {
			'plot:daterange'() {
				store.dispatch.plot.toggleQueryRange()
			},
			'plot:info'() {
				store.dispatch.routing.push('/channel-info')
			},
			'plot:settings'() {
				store.dispatch.routing.push('/plot-settings')
			},
			'plot:share'() {
				store.dispatch.plot.showShareLink()
			},
			'plot:download'() {
				store.dispatch.plot.showDownload()
			},
			'indexplot:first'() {
				store.dispatch.indexplot.gotoFirstEvent()
			},
			'indexplot:prev'() {
				store.dispatch.indexplot.gotoPrevEvent()
			},
			'indexplot:next'() {
				store.dispatch.indexplot.gotoNextEvent()
			},
			'indexplot:last'() {
				store.dispatch.indexplot.gotoLastEvent()
			},
		}
	}

	constructor() {
		super()
	}

	private actionItemsByPage: { [key: string]: TemplateResult } = {
		[ROUTE.PLOT]: html`<mwc-icon-button
				title="select plot range"
				icon="date_range"
				@click=${() => this.dispatchEvent(new CustomEvent('plot:daterange'))}
			></mwc-icon-button
			><mwc-icon-button
				title="download channel data"
				icon="cloud_download"
				@click=${() => this.dispatchEvent(new CustomEvent('plot:download'))}
			></mwc-icon-button
			><mwc-icon-button
				title="share a link to this plot"
				icon="share"
				@click=${() => this.dispatchEvent(new CustomEvent('plot:share'))}
			></mwc-icon-button
			><mwc-icon-button
				title="change plot settings"
				icon="settings"
				@click=${() => this.dispatchEvent(new CustomEvent('plot:settings'))}
			></mwc-icon-button
			><mwc-icon-button
				title="view query information"
				icon="info_outline"
				@click=${() => this.dispatchEvent(new CustomEvent('plot:info'))}
			></mwc-icon-button>`,
		[ROUTE.INDEX_PLOT]: html`<mwc-icon-button
				title="first event"
				icon="first_page"
				@click=${() => this.dispatchEvent(new CustomEvent('indexplot:first'))}
			></mwc-icon-button>
			<mwc-icon-button
				title="previous event"
				icon="chevron_left"
				@click=${() => this.dispatchEvent(new CustomEvent('indexplot:prev'))}
			></mwc-icon-button>
			<mwc-icon-button
				title="next event"
				icon="chevron_right"
				@click=${() => this.dispatchEvent(new CustomEvent('indexplot:next'))}
			></mwc-icon-button>
			<mwc-icon-button
				title="last event"
				icon="last_page"
				@click=${() => this.dispatchEvent(new CustomEvent('indexplot:last'))}
			></mwc-icon-button>`,
	}

	shouldUpdate(changedProperties: PropertyValues) {
		if (changedProperties.has('page')) {
			this.templateResult = this.actionItemsByPage[this.page] ?? nothing
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
