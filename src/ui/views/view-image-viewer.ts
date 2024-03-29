import { css, html, LitElement, nothing } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { connect } from '@captaincodeman/rdx'

import '@material/mwc-circular-progress'

import '../components/daq-range-select'
import '../components/daq-correlation-plot'
import type { PlotEventDetail } from '../components/daq-range-select'
import '../components/daq-thumbnail-list'

import { store } from '../../state/store'
import type { AppState } from '../../state/store'
import {
	baseStyles,
	colorHelpers,
	opacityHelpers,
	paddingHelpers,
	shadowHelpers,
	sizeHelpers,
	textHelpers,
} from '../shared-styles'
import type { DataUiChannel } from '../../shared/channel'
import { imageviewerSelectors } from '../../state/models/imageviewer'
import type { DataUiDataPoint, DataUiImage } from '../../shared/dataseries'

declare global {
	interface HTMLElementTagNameMap {
		'view-image-viewer': ViewImageViewerElement
	}
}

@customElement('view-image-viewer')
export class ViewImageViewerElement extends connect(store, LitElement) {
	@state() private channel?: DataUiChannel
	@state() private startTime: number = Date.now() - 3_600_000
	@state() private endTime: number = Date.now()
	@state() private fetching: boolean = false
	@state() private error?: Error
	@state() private thumbnails: DataUiDataPoint<number, DataUiImage>[] = []
	@state() private canLoadMore: boolean = false
	@state() private currentSlice = 0

	mapState(state: AppState) {
		return {
			channel: imageviewerSelectors.channel(state),
			startTime: imageviewerSelectors.startTime(state),
			endTime: imageviewerSelectors.endTime(state),
			fetching: imageviewerSelectors.fetching(state),
			error: imageviewerSelectors.error(state),
			thumbnails: imageviewerSelectors.thumbnails(state),
			canLoadMore: imageviewerSelectors.canLoadMoreSlices(state),
			currentSlice: imageviewerSelectors.currentSlice(state),
		}
	}

	firstUpdated() {
		if (this.channel === undefined) {
			store.dispatch.routing.replace('/')
		}
	}

	render() {
		return html`
			<daq-range-select
				class="shadow"
				.startTime=${this.startTime}
				.endTime=${this.endTime}
				hideQueryExpansion
				@startchanged=${(e: CustomEvent<{ time: number }>) => {
					const start = e.detail.time
					const end = this.endTime
					store.dispatch.imageviewer.setRange({ start, end })
				}}
				@endchanged=${(e: CustomEvent<{ time: number }>) => {
					const start = this.startTime
					const end = e.detail.time
					store.dispatch.imageviewer.setRange({ start, end })
				}}
				@plot=${(e: CustomEvent<PlotEventDetail>) => {
					const { start, end } = e.detail
					store.dispatch.imageviewer.setRange({ start, end })
					store.dispatch.imageviewer.fetchFirstSlice()
				}}
			></daq-range-select>
			<div style="overflow-y:auto;" class="shadow p-4">
				<daq-thumbnail-list
					.fetching=${this.fetching}
					.thumbnails=${this.thumbnails}
					slicesize="20"
					.currentSlice=${this.currentSlice}
					@imageslice-canceled=${() =>
						store.dispatch.imageviewer.setSliceLoadingCanceled(true)}
				>
				</daq-thumbnail-list>
				<mwc-button
					raised
					label="Load more"
					?disabled=${!this.canLoadMore}
					@click=${() => store.dispatch.imageviewer.fetchNextSlice()}
				></mwc-button>
			</div>
		`
	}

	static get styles() {
		return [
			baseStyles,
			colorHelpers,
			opacityHelpers,
			paddingHelpers,
			shadowHelpers,
			sizeHelpers,
			textHelpers,
			css`
				:host {
					height: calc(100vh - 48px);
					width: 100%;
					padding: 8px;
					display: grid;
					grid-template-columns: 1fr;
					gap: 8px;
					grid-template-rows: auto 1fr;
				}
				mwc-button {
					margin: 4px;
				}
			`,
		]
	}
}
