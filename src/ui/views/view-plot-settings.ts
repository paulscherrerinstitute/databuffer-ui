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

import {
	baseStyles,
	colorHelpers,
	flexHelpers,
	opacityHelpers,
	paddingHelpers,
	sizeHelpers,
	textHelpers,
} from '../shared-styles'
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
			<div id="axeslist" class="fullwidth text-small">
				<div class="bg-primary fg-on-primary px-8 py-2 text-centered">
					Channel
				</div>
				<div class="bg-primary fg-on-primary px-8 py-2 text-centered">
					Backend
				</div>
				<div class="bg-primary fg-on-primary px-8 py-2 text-centered">
					Label
				</div>
				<div class="bg-primary fg-on-primary px-8 py-2 text-centered">
					Axis type
				</div>
				<div class="bg-primary fg-on-primary px-8 py-2 text-centered">
					Scaling
				</div>
				${this.dataSeries.map((x, idx) => {
					const yAxis = this.yAxes[x.yAxisIndex]
					return html`
						<div class="px-2">
							${channelToId(x.channel)}<br /><span
								class="opacity-70 text-smallest"
								>${x.channel.description}</span
							>
						</div>
						<div class="px-2">${x.channel.backend}</div>
						<div class="flex-row">
							<mwc-textfield
								class="flex-grow"
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
						</div>
						<div>
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
						</div>
						<div>
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
						</div>
					`
				})}
			</div>
		`
	}

	static get styles() {
		return [
			baseStyles,
			sizeHelpers,
			textHelpers,
			opacityHelpers,
			paddingHelpers,
			colorHelpers,
			flexHelpers,
			css`
				:host {
					height: 100%;
					padding: 8px;
				}
				#axeslist {
					margin-top: 8px;
					border: 1px solid rgba(0, 0, 0, 0.54);
					display: grid;
					grid-template-columns: 1fr auto 1fr auto auto;
					grid-template-rows: auto;
					gap: 2px;
					align-items: center;
				}
			`,
		]
	}
}
