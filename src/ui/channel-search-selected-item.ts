import { LitElement, customElement, css, html, property } from 'lit-element'
import 'weightless/list-item'
import '@material/mwc-icon-button'
import '@psi/databuffer-web-components/daq-pill'

@customElement('channel-search-selected-item')
export class ChannelSearchSelectedItemElement extends LitElement {
	@property({ attribute: false }) backend: string
	@property({ attribute: false }) name: string

	public render() {
		return html`<wl-list-item class="hide-buttons-until-hover">
			<daq-pill slot="after">${this.backend}</daq-pill>
			<span slot="after">
				<mwc-icon-button
					class="small"
					icon="delete"
					@click=${() =>
						this.dispatchEvent(
							new CustomEvent('channel-search-selected-item:remove', {
								composed: true,
								bubbles: true,
								detail: { backend: this.backend, name: this.name },
							})
						)}
				></mwc-icon-button>
			</span>
			${this.name}
		</wl-list-item>`
	}

	public static get styles() {
		return [
			css`
				mwc-icon-button.small {
					--mdc-icon-size: 16px;
					--mdc-icon-button-size: 32px;
				}

				.hide-buttons-until-hover mwc-icon-button {
					opacity: 0%;
					margin-left: 8px;
					transition-property: opacity;
					transition-duration: 0.2s;
				}

				.hide-buttons-until-hover:hover mwc-icon-button {
					opacity: 100%;
					transition-property: opacity;
					transition-duration: 0.4s;
				}
			`,
		]
	}
}
