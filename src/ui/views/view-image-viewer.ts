import { css, html, LitElement } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { connect } from '@captaincodeman/rdx'

import '@material/mwc-circular-progress'

import '../components/daq-range-select'
import '../components/daq-correlation-plot'
import type { PlotEventDetail } from '../components/daq-range-select'

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
import { formatDate } from '../../util'

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
	@state() private queryExpansion: boolean = false
	@state() private fetching: boolean = false
	@state() private error?: Error

	mapState(state: AppState) {
		return {
			channel: imageviewerSelectors.channel(state),
			startTime: imageviewerSelectors.startTime(state),
			endTime: imageviewerSelectors.endTime(state),
			queryExpansion: imageviewerSelectors.queryExpansion(state),
			fetching: imageviewerSelectors.fetching(state),
			error: imageviewerSelectors.error(state),
		}
	}

	render() {
		return html`
			<daq-range-select
				class="shadow"
				.startTime=${this.startTime}
				.endTime=${this.endTime}
				.queryExpansion=${this.queryExpansion}
				@plot=${(e: CustomEvent<PlotEventDetail>) => {
					const { start, end, queryExpansion } = e.detail
					store.dispatch.imageviewer.setRange({ start, end })
					store.dispatch.imageviewer.setQueryExpansion(queryExpansion)
					// store.dispatch.imageviewer.drawPlot()
				}}
			></daq-range-select>
			${this.fetching
				? html`<mwc-circular-progress indeterminate></mwc-circular-progress>`
				: html`<div>PLACEHOLDER -- WIP</div>`}
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
					height: 100%;
					width: 100%;
					padding: 8px;
					display: grid;
					grid-template-columns: 1fr;
					gap: 8px;
					grid-template-rows: auto auto 1fr;
				}
				#axesgrid {
					display: grid;
					grid-template-columns: auto 1fr auto;
					gap: 2px;
				}
			`,
		]
	}
}
