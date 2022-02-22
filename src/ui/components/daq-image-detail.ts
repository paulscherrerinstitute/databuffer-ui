import { css, html, LitElement } from 'lit'
import { customElement, property, query, state } from 'lit/decorators.js'
import { baseStyles, sizeHelpers } from '../shared-styles'

declare global {
	interface HTMLElementTagNameMap {
		'daq-image-detail': DaqImageDetailElement
	}
}

@customElement('daq-image-detail')
export class DaqImageDetailElement extends LitElement {
	@property({ type: String })
	title = '???'

	@property({ attribute: false })
	image = ''

	render() {
		return html`<span>${this.title}</span>
			<div
				id="noimage"
				?hidden=${this.image !== ''}
				class="fullwidth fullheight"
			>
				<span>No thumbnail selected</span>
			</div>`
	}

	static get styles() {
		return [
			baseStyles,
			sizeHelpers,
			css`
				:host {
					display: grid;
					gap: 4px;
					grid-template-rows: auto 1fr;
					grid-template-columns: 1fr;
					align-items: center;
					justify-items: center;
				}
				:host([hidden]) {
					display: none;
				}
				#noimage {
					color: hsl(0, 0%, 40%);
					font-size: 2rem;
					background-color: hsl(0, 0%, 90%);
					display: flex;
					align-items: center;
					justify-items: center;
				}
				#noimage > span {
					flex-grow: 1;
				}
			`,
		]
	}
}
