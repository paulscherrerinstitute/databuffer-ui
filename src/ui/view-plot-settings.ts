import { LitElement, customElement, html, property, css } from 'lit-element'

import { RootState, store } from '../store'
import {
	Channel,
	PlotSelectors,
	PlotActions,
	DataSeries,
	YAxis,
	YAxisType,
} from '../store/plot'

import { baseStyles } from './shared-styles'
import { connect } from '@captaincodeman/redux-connect-element'
import '@material/mwc-list/mwc-list-item'
import '@material/mwc-select'
import '@material/mwc-textfield'

@customElement('view-plot-settings')
export class PlotSettingsElement extends connect(store, LitElement) {
	@property({ attribute: false }) channels: Channel[]
	@property({ attribute: false }) dataSeriesConfig: DataSeries[]
	@property({ attribute: false }) plotTitle: string
	@property({ attribute: false }) yAxes: YAxis[] = []

	mapState(state: RootState) {
		return {
			channels: PlotSelectors.channels(state),
			dataSeriesConfig: PlotSelectors.dataSeriesConfig(state),
			plotTitle: PlotSelectors.plotTitle(state),
			yAxes: PlotSelectors.yAxes(state),
		}
	}

	mapEvents() {
		return {
			'title-change': (e: CustomEvent<{ title: string }>) =>
				PlotActions.plotTitleChange(e.detail.title),
			'series-label': (e: CustomEvent<{ index: number; label: string }>) =>
				PlotActions.dataSeriesLabelChange(e.detail.index, e.detail.label),
			'axis:scale:min': (
				e: CustomEvent<{ index: number; min: number | null }>
			) => PlotActions.setAxisMin(e.detail.index, e.detail.min),
			'axis:scale:max': (
				e: CustomEvent<{ index: number; max: number | null }>
			) => PlotActions.setAxisMax(e.detail.index, e.detail.max),
			'axis:type': (e: CustomEvent<{ index: number; type: YAxisType }>) =>
				PlotActions.setAxisType(e.detail.index, e.detail.type),
		}
	}

	render() {
		return html`
			<mwc-textfield
				class="fullwidth"
				label="Plot title"
				.value=${this.plotTitle}
				@change=${e =>
					this.dispatchEvent(
						new CustomEvent('title-change', {
							detail: { title: e.target.value },
						})
					)}
			></mwc-textfield>
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
					const yAxis = this.yAxes[series.yAxisIndex]
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
							<td>
								<mwc-select
									@change=${e =>
										this.dispatchEvent(
											new CustomEvent('axis:type', {
												detail: {
													index: series.yAxisIndex,
													type: e.target.value,
												},
											})
										)}
								>
									<mwc-list-item
										?selected=${yAxis.type === 'linear'}
										value="linear"
										>linear</mwc-list-item
									>
									<mwc-list-item
										?selected=${yAxis.type === 'logarithmic'}
										value="logarithmic"
										>logarithmic</mwc-list-item
									>
								</mwc-select>
							</td>
							<td>
								<mwc-textfield
									label="Min"
									placeholder="automatic"
									.value=${yAxis.min !== null ? yAxis.min.toString() : ''}
									@change=${e =>
										this.dispatchEvent(
											new CustomEvent('axis:scale:min', {
												detail: {
													index: series.yAxisIndex,
													min:
														e.target.value === ''
															? null
															: Number.parseFloat(e.target.value),
												},
											})
										)}
								></mwc-textfield>
								<mwc-textfield
									label="Max"
									placeholder="automatic"
									.value=${yAxis.max !== null ? yAxis.max.toString() : ''}
									@change=${e =>
										this.dispatchEvent(
											new CustomEvent('axis:scale:max', {
												detail: {
													index: series.yAxisIndex,
													max:
														e.target.value === ''
															? null
															: Number.parseFloat(e.target.value),
												},
											})
										)}
								></mwc-textfield>
							</td>
							<td>auto</td>
						</tr>
					`
				})}
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
				.fullwidth {
					width: 100%;
				}
				table {
					width: 100%;
				}
			`,
		]
	}
}
