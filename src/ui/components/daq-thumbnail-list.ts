import { css, html, LitElement, nothing, PropertyValues } from 'lit'
import { customElement, property, query, state } from 'lit/decorators.js'
import type { DataUiDataPoint, DataUiImage } from '../../shared/dataseries'
import { formatDate } from '../../util'
import { baseStyles } from '../shared-styles'

declare global {
	interface HTMLElementTagNameMap {
		'daq-thumbnail-list': DaqThumbnailListElement
	}
}

export type Thumbnail = DataUiDataPoint<number, DataUiImage>
export type ThumbnailSlice = { ts: number; thumbnails: Thumbnail[] }

@customElement('daq-thumbnail-list')
export class DaqThumbnailListElement extends LitElement {
	@property({ type: Boolean })
	fetching = false

	@property({ attribute: false })
	thumbnails: Thumbnail[] = []

	@property({ type: Number })
	slicesize = 50

	@state()
	slices: ThumbnailSlice[] = []

	updated(changedProperties: PropertyValues): void {
		if (
			changedProperties.has('thumbnails') ||
			changedProperties.has('slicesize')
		) {
			this._recalcSlices()
		}
	}

	private _recalcSlices() {
		this.slices = []
		if (this.thumbnails.length === 0) {
			return
		}
		for (let i = 0; i < this.thumbnails.length; i += this.slicesize) {
			const ts = this.thumbnails[i].x
			const thumbnails = this.thumbnails.slice(i, i + this.slicesize)
			this.slices.push({ ts, thumbnails })
		}
	}

	private _renderSlice(s: ThumbnailSlice) {
		return html`<div>
			<div class="slice-title">${formatDate(s.ts)}</div>
			<div class="thumbnail-container">
				${s.thumbnails.map(
					t =>
						html`<img
							class="thumbnail"
							src=${t.y}
							title="${formatDate(t.x)}"
						/>`
				)}
			</div>
		</div> `
	}

	render() {
		return html`<div>
			${this.slices.map(x => this._renderSlice(x))}
			<mwc-circular-progress
				?hidden=${!this.fetching}
				indeterminate
			></mwc-circular-progress>
		</div>`
	}

	static get styles() {
		return [
			baseStyles,
			css`
				:host {
					display: grid;
					grid-template-columns: 1fr;
					grid-template-rows: 1fr;
				}
				mwc-circular-progress[hidden] {
					display: none;
				}
				.slice-title {
					color: hsl(0, 0%, 70%);
					font-size: 75%;
					margin: 12px 0px 0px 4px;
				}
				.thumbnail-container {
					line-height: 0;
				}
				.thumbnail {
					display: inline-block;
					margin: 4px;
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
