import {
	LitElement,
	customElement,
	html,
	property,
	css,
	PropertyValues,
} from 'lit-element'
import { unsafeHTML } from 'lit-html/directives/unsafe-html'
import { connect } from '@captaincodeman/rdx'
import { store, State } from '../state/store'
import { baseStyles } from './shared-styles'

@customElement('app-router')
export class AppRouterElement extends connect(store, LitElement) {
	@property({ type: String }) page: string
	@property({ type: String }) view: string

	mapState(state: State) {
		return {
			page: state.routing.page,
		}
	}

	constructor() {
		super()
	}

	private viewByPage = {
		home: `<view-home></view-home>`,
		'channel-search': `<view-channel-search></view-channel-search>`,
		plot: `<view-standard-plot></view-standard-plot>`,
		'plot-settings': `<view-plot-settings></view-plot-settings>`,
		'query-meta': `<view-query-meta></view-query-meta>`,
	}

	shouldUpdate(changedProperties: PropertyValues) {
		if (changedProperties.has('page')) {
			this.view = this.viewByPage[this.page] ?? `<view-error></view-error>`
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
