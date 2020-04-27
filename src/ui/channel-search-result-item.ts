import { LitElement, css, customElement, html, property } from 'lit-element'
import 'weightless/checkbox'
import type { Checkbox } from 'weightless/checkbox'
import 'weightless/list-item'
import '@psi/databuffer-web-components/daq-pill'
import '@psi/databuffer-web-components/daq-pill-list'
import { ChannelWithTags } from '../store/channelsearch'

@customElement('channel-search-result-item')
export class ChannelSearchResultItemElement extends LitElement {
	@property({ attribute: false }) item: ChannelWithTags = null
	@property({ attribute: false }) selectedIndex: number = -1
	@property({ attribute: false }) activeFilters: string[] = []

	public render() {
		return html`
			<wl-list-item>
				<wl-checkbox
					slot="before"
					?checked=${this.selectedIndex >= 0}
					@change=${(e: Event) => {
						if ((e.target as Checkbox).checked) {
							return this.dispatchEvent(
								new CustomEvent('channel-select', {
									composed: true,
									bubbles: true,
									detail: {
										// reduce ChannelWithTags to Channel
										channel: {
											backend: this.item.backend,
											name: this.item.name,
										},
									},
								})
							)
						}
						this.dispatchEvent(
							new CustomEvent('channel-remove', {
								composed: true,
								bubbles: true,
								detail: { index: this.selectedIndex },
							})
						)
					}}
				></wl-checkbox>
				<daq-pill-list
					slot="after"
					selectable
					.selected=${this.activeFilters.filter(x =>
						this.item.tags.includes(x)
					)}
					.value=${this.item.tags}
				></daq-pill-list>
				<div class="channel-name">${this.item.name}</div>
				<div class="channel-description">${this.item.description}</div>
			</wl-list-item>
		`
	}

	public static get styles() {
		return [
			css`
				.channel-name {
					font-size: inherit;
				}
				.channel-description {
					font-size: 75%;
					color: rgba(0, 0, 0, 0.7);
				}
			`,
		]
	}
}
