import { LitElement, html, css, PropertyValues } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { connect } from '@captaincodeman/rdx'
import { store, AppState } from '../state/store'
import { baseStyles } from './shared-styles'
import { ROUTE } from '../state/routing'

@customElement('app-router')
export class AppRouterElement extends connect(store, LitElement) {
	@state() page: string = ''
	@state() view: string = ''

	mapState(state: AppState) {
		return {
			page: state.routing.page,
		}
	}

	constructor() {
		super()
	}

	private viewByPage: { [key: string]: string } = {
		[ROUTE.HOME]: `<view-home></view-home>`,
		[ROUTE.CHANNEL_INFO]: `<view-channel-info></view-channel-info>`,
		[ROUTE.CHANNEL_SEARCH]: `<view-channel-search></view-channel-search>`,
		[ROUTE.CORRELATION_PLOT]: `<view-correlation-plot></view-correlation-plot>`,
		[ROUTE.IMAGE_VIEWER]: `<view-image-viewer></view-image-viewer>`,
		[ROUTE.INDEX_PLOT]: `<view-index-plot></view-index-plot>`,
		[ROUTE.PLOT]: `<view-plot></view-plot>`,
		[ROUTE.PLOT_SETTINGS]: `<view-plot-settings></view-plot-settings>`,
		[ROUTE.PRESELECT]: `<view-preselect></view-preselect>`,
	}

	shouldUpdate(changedProperties: PropertyValues) {
		if (changedProperties.has('page')) {
			this.view =
				this.viewByPage[this.page] ?? `<view-not-found></view-not-found>`
		}
		return changedProperties.has('view')
	}

	render() {
		return html`${unsafeHTML(this.view)}`
	}

	static get styles() {
		return [
			baseStyles,
			css`
				:host {
					/* mwc-top-app-bar-fixed[dense] is 48px tall */
					height: calc(100vh - 48px);
				}
			`,
		]
	}
}
