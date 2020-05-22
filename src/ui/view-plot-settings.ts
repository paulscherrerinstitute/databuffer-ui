import { LitElement, customElement, html, property, css } from 'lit-element'

import { RootState, store } from '../store'
import { Channel, PlotSelectors, PlotActions, DataSeries } from '../store/plot'

import { baseStyles } from './shared-styles'
import { connect } from '@captaincodeman/redux-connect-element'
import '@material/mwc-textfield'

@customElement('view-plot-settings')
export class PlotSettingsElement extends connect(store, LitElement) {
	@property({ attribute: false }) channels: Channel[]
	@property({ attribute: false }) dataSeriesConfig: DataSeries[]
	@property({ attribute: false }) plotTitle: string

	mapState(state: RootState) {
		return {
			channels: PlotSelectors.channels(state),
			dataSeriesConfig: PlotSelectors.dataSeriesConfig(state),
			plotTitle: PlotSelectors.plotTitle(state),
		}
	}

	mapEvents() {
		return {
			'title-change': (e: CustomEvent<{ title: string }>) =>
				PlotActions.plotTitleChange(e.detail.title),
			'series-label': (e: CustomEvent<{ index: number; label: string }>) =>
				PlotActions.dataSeriesLabelChange(e.detail.index, e.detail.label),
		}
	}

	render() {
		return html`
			<mwc-textfield label="Plot title" .value=${this.plotTitle} @change=${e =>
			this.dispatchEvent(
				new CustomEvent('title-change', { detail: { title: e.target.value } })
			)}></mwc-textfield>
			<h2>Data series and axes</h2>
				<table>
					<tr>
						<th>Backend</th>
						<th>Channel</th>
						<th>Label</th>
						<th>Axis type</th>
						<th>Scaling</th>
						<th>Color</th>
					</tr>
					${this.dataSeriesConfig.map((series, idx) => {
						const ch = this.channels[series.channelIndex]
						return html`
							<tr>
								<td>${ch.backend}</td>
								<td>${ch.name}</td>
								<td>
									<mwc-textfield
										.value=${series.name}
										@change=${e =>
											this.dispatchEvent(
												new CustomEvent('series-label', {
													detail: {
														index: idx,
														label: e.target.value,
													},
												})
											)}
									></mwc-textfield>
								</td>
								<td>linear</td>
								<td>auto</td>
								<td>auto</td>
							</tr>
						`
					})}
				</table>
			</mwc-textfield>
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
				mwc-textfield {
					width: 100%;
				}
				table {
					width: 100%;
				}
			`,
		]
	}
}
