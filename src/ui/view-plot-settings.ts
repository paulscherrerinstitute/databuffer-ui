import { LitElement, customElement, html, property, css } from 'lit-element'

import { AppState, store } from '../state/store'
import {
	Channel,
	DataSeries,
	YAxis,
	YAxisType,
	plotSelectors,
	PlotVariation,
} from '../state/models/plot'

import { baseStyles } from './shared-styles'
import { connect } from '@captaincodeman/rdx'
import '@material/mwc-list/mwc-list-item'
import '@material/mwc-select'
import '@material/mwc-textfield'
import { TextField } from '@material/mwc-textfield'
import { Select } from '@material/mwc-select'

@customElement('view-plot-settings')
export class PlotSettingsElement extends connect(store, LitElement) {
	@property({ attribute: false }) channels: Channel[] = []
	@property({ attribute: false }) dataSeriesConfig: DataSeries[] = []
	@property({ attribute: false }) plotVariation: PlotVariation =
		PlotVariation.SeparateAxes
	@property({ attribute: false }) plotTitle: string = ''
	@property({ attribute: false }) yAxes: YAxis[] = []

	mapState(state: AppState) {
		return {
			channels: plotSelectors.channels(state),
			dataSeriesConfig: plotSelectors.dataSeriesConfig(state),
			plotVariation: plotSelectors.plotVariation(state),
			plotTitle: plotSelectors.plotTitle(state),
			yAxes: plotSelectors.yAxes(state),
		}
	}

	render() {
		return html`
			<mwc-textfield
				class="fullwidth"
				label="Plot title"
				.value=${this.plotTitle}
				@change=${(e: Event) => {
					if (e.target === null) return
					const v = (e.target as TextField).value
					store.dispatch.plot.changePlotTitle(v)
				}}
			></mwc-textfield>
			<h2>Plot variation</h2>
			<mwc-select
				@change=${(e: Event) => {
					if (e.target === null) return
					const v = (e.target as Select).value
					store.dispatch.plot.changePlotVariation(v as PlotVariation)
				}}
			>
				<mwc-list-item
					?selected=${this.plotVariation === PlotVariation.SingleAxis}
					.value=${PlotVariation.SingleAxis}
					>Single Y axis</mwc-list-item
				>
				<mwc-list-item
					?selected=${this.plotVariation === PlotVariation.SeparateAxes}
					.value=${PlotVariation.SeparateAxes}
					>Separate Y axes</mwc-list-item
				>
				<mwc-list-item
					?selected=${this.plotVariation === PlotVariation.SeparatePlots}
					.value=${PlotVariation.SeparatePlots}
					>Separate plots</mwc-list-item
				>
			</mwc-select>
			<h2>Data series and axes</h2>
			<table>
				<tr>
					<th>Backend</th>
					<th>Channel</th>
					<th>Label</th>
					<th>Axis type</th>
					<th>Scaling</th>
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
									@change=${(e: Event) => {
										if (e.target === null) return
										const v = (e.target as TextField).value
										store.dispatch.plot.changeDataSeriesLabel({
											index: idx,
											label: v,
										})
									}}
								></mwc-textfield>
							</td>
							<td>
								<mwc-select
									?disabled=${idx > 0 &&
									this.plotVariation === PlotVariation.SingleAxis}
									@change=${(e: Event) => {
										if (e.target === null) return
										const v = (e.target as Select).value
										store.dispatch.plot.setAxisType({
											index: series.yAxisIndex,
											type: v as YAxisType,
										})
									}}
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
									?disabled=${idx > 0 &&
									this.plotVariation === PlotVariation.SingleAxis}
									.value=${yAxis.min !== null ? yAxis.min.toString() : ''}
									@change=${(e: Event) => {
										if (e.target === null) return
										const v = (e.target as TextField).value
										store.dispatch.plot.setAxisMin({
											index: series.yAxisIndex,
											min: v === '' ? null : Number.parseFloat(v),
										})
									}}
								></mwc-textfield>
								<mwc-textfield
									label="Max"
									placeholder="automatic"
									?disabled=${idx > 0 &&
									this.plotVariation === PlotVariation.SingleAxis}
									.value=${yAxis.max !== null ? yAxis.max.toString() : ''}
									@change=${(e: Event) => {
										if (e.target === null) return
										const v = (e.target as TextField).value
										store.dispatch.plot.setAxisMax({
											index: series.yAxisIndex,
											max: v === '' ? null : Number.parseFloat(v),
										})
									}}
								></mwc-textfield>
							</td>
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
