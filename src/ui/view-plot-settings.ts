import { LitElement, customElement, html, property, css } from 'lit-element'

import { formatDate } from '../util'
import { RootState, store } from '../store'
import { Channel, PlotSelectors } from '../store/plot'

import type { DataResponse } from '../api/queryrest'
import { baseStyles } from './shared-styles'
import { connect } from '@captaincodeman/redux-connect-element'

@customElement('view-plot-settings')
export class PlotSettingsElement extends connect(store, LitElement) {
	@property({ attribute: false }) channels: Channel[]
	@property({ attribute: false }) channelsWithoutData: Channel[]
	@property({ attribute: false }) error: Error
	@property({ attribute: false }) fetching: boolean
	@property({ attribute: false }) requestDuration: number
	@property({ attribute: false }) requestFinishedAt: number
	@property({ attribute: false }) response: DataResponse

	mapState(state: RootState) {
		return {
			channels: PlotSelectors.channels(state),
		}
	}

	render() {
		return html`
			<table>
				<tr>
					<th>Backend</th>
					<th>Channel</th>
					<th>Label</th>
					<th>Axis type</th>
					<th>Scaling</th>
					<th>Color</th>
				</tr>
				${this.channels.map(
					item =>
						html`
							<tr>
								<td>${item.backend}</td>
								<td>${item.name}</td>
								<td>${item.name}</td>
								<td>linear</td>
								<td>auto</td>
								<td>auto</td>
							</tr>
						`
				)}
			</table>
		`
	}

	static get styles() {
		return [
			baseStyles,
			css`
				:host {
					height: 100%;
					padding: 8px;
				}
				table {
					width: 100%;
				}
			`,
		]
	}
}
