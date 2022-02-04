import { LitElement, html, css } from 'lit'
import { customElement, state } from 'lit/decorators.js'

import { AppState, store } from '../../state/store'
import {
	YAxis,
	YAxisType,
	plotSelectors,
	PlotVariation,
	PlotDataSeries,
} from '../../state/models/plot'

import { baseStyles, sizeHelpers } from '../shared-styles'
import { connect } from '@captaincodeman/rdx'
import '@material/mwc-list/mwc-list-item'
import '@material/mwc-select'
import '@material/mwc-textfield'
import { TextField } from '@material/mwc-textfield'
import { Select } from '@material/mwc-select'
import { channelToId, DataUiChannel } from '../../shared/channel'

@customElement('view-plot-settings')
export class PlotSettingsElement extends connect(store, LitElement) {
	@state() channels: DataUiChannel[] = []
	@state() dataSeries: PlotDataSeries[] = []
	@state() plotVariation: PlotVariation = PlotVariation.SeparateAxes
	@state() plotTitle: string = ''
	@state() yAxes: YAxis[] = []

	mapState(state: AppState) {
		return {
			channels: plotSelectors.channels(state),
			dataSeries: plotSelectors.plotDataSeries(state),
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
			<table class="fullwidth">
				<tr>
					<th>Channel</th>
					<th>Label</th>
					<th>Axis type</th>
					<th>Scaling</th>
				</tr>
				${this.dataSeries.map((x, idx) => {
					const yAxis = this.yAxes[x.yAxisIndex]
					return html`
						<tr>
							<td>
								${channelToId(x.channel)}<br /><span class="description"
									>${x.channel.description}</span
								>
							</td>
							<td>
								<mwc-textfield
									.value=${x.label}
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
											index: x.yAxisIndex,
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
											index: x.yAxisIndex,
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
											index: x.yAxisIndex,
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
			sizeHelpers,
			css`
				:host {
					height: 100%;
					padding: 8px;
				}

				.description {
					font-size: 75%;
					color: rgba(0, 0, 0, 0.7);
				}
			`,
		]
	}
}
