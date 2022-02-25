import { css, html, LitElement } from 'lit'
import { customElement, property, query, state } from 'lit/decorators.js'

import '@material/mwc-circular-progress'
import { baseStyles } from '../shared-styles'

declare global {
	interface HTMLElementTagNameMap {
		'daq-progress': DaqProgressElement
	}
}

@customElement('daq-progress')
export class DaqProgressElement extends LitElement {
	@property({ type: String })
	status = 'loading'

	render() {
		return html`<slot></slot>
			<mwc-circular-progress indeterminate></mwc-circular-progress>
			<slot name="action"></slot>`
	}

	static get styles() {
		return [
			baseStyles,
			css`
				:host {
					display: flex;
					flex-direction: column;
					align-items: center;
				}
				:host([hidden]) {
					display: none;
				}
			`,
		]
	}
}
