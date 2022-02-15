import { css, html, LitElement } from 'lit'
import { customElement, property, query, state } from 'lit/decorators.js'

import '@material/mwc-icon-button'

import { DataUiDataPoint, DataUiImage } from '../../shared/dataseries'
import { formatDate } from '../../util'
import { baseStyles, sizeHelpers } from '../shared-styles'

declare global {
	interface HTMLElementTagNameMap {
		'daq-thumbnail-strip': DaqThumbnailStripElement
	}
}

declare global {
	interface DocumentEventMap {
		'thumbnail-selected': CustomEvent<{ index: number }>
	}
}

@customElement('daq-thumbnail-strip')
export class DaqThumbnailStripElement extends LitElement {
	@property({ type: Boolean })
	fetching = false

	@property({ attribute: false })
	thumbnails: DataUiDataPoint<number, DataUiImage>[] = []

	private _thumbnailClicked(index: number) {
		this.dispatchEvent(
			new CustomEvent('thumbnail-selected', {
				bubbles: true,
				composed: true,
				detail: { index },
			})
		)
	}

	private _renderThumbnails() {
		if (this.fetching)
			return html`<mwc-circular-progress indeterminate></mwc-circular-progress>`
		return this.thumbnails.map(
			(t, idx) =>
				html`<img
					class="thumbnail"
					src=${t.y}
					title="${formatDate(t.x)}"
					@click=${() => this._thumbnailClicked(idx)}
				/>`
		)
	}

	render() {
		return html`
			<mwc-icon-button
				raised
				icon="keyboard_double_arrow_left"
				@click=${() => {
					// store.dispatch.imageviewer.setRange({
					// 	start: this.startTime - 10000,
					// 	end: this.endTime,
					// })
					// store.dispatch.imageviewer.fetchThumbnails()
				}}
			>
			</mwc-icon-button>
			<div id="thumbnail-container">${this._renderThumbnails()}</div>
			<mwc-icon-button
				raised
				icon="keyboard_double_arrow_right"
				@click=${() => {
					// store.dispatch.imageviewer.setRange({
					// 	start: this.startTime,
					// 	end: this.endTime + 10000,
					// })
					// store.dispatch.imageviewer.fetchThumbnails()
				}}
			>
			</mwc-icon-button>
		`
	}

	static get styles() {
		return [
			baseStyles,
			sizeHelpers,
			css`
				:host {
					line-height: 0;
					display: grid;
					grid-template-columns: auto 1fr auto;
					gap: 2px;
					grid-template-rows: auto;
					align-items: center;
				}
				#thumbnail-container {
					overflow-x: scroll;
					white-space: nowrap;
				}
				.thumbnail {
					display: inline-block;
					margin: 4px;
					cursor: pointer;
				}
				.thumbnail:hover {
					opacity: 0.8;
					outline: 2px solid;
					outline-color: var(--dui-primary);
					outline-offset: 2px;
				}
			`,
		]
	}
}
