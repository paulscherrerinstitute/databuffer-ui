import { html, css, LitElement } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { baseStyles } from '../shared-styles'
import { getColor } from './highcharts'

declare global {
	interface HTMLElementTagNameMap {
		'daq-color-box': DaqColorBoxElement
	}
}

@customElement('daq-color-box')
export class DaqColorBoxElement extends LitElement {
	@property({ type: Number })
	index: number = 0

	@state()
	private color: string = 'none'

	protected updated() {
		this.color = getColor(this.index) ?? 'none'
	}

	render() {
		return html`<span style="background-color:${this.color}"></span>`
	}

	static get styles() {
		return [
			baseStyles,
			css`
				span {
					height: 12px;
					width: 12px;
					border: none;
					border-radius: 2px;
					display: inline-block;
				}
			`,
		]
	}
}
