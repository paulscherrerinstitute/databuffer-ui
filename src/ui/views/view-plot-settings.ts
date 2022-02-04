import { LitElement, html, css } from 'lit'
import { customElement, query, state } from 'lit/decorators.js'

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
import '@material/mwc-formfield'
import '@material/mwc-icon-button'
import type { ActionDetail } from '@material/mwc-list/mwc-list.js'
import '@material/mwc-list/mwc-list-item'
import '@material/mwc-menu'
import type { Menu } from '@material/mwc-menu/mwc-menu.js'
import '@material/mwc-select'
import type { Select } from '@material/mwc-select'
import '@material/mwc-switch'
import type { Switch } from '@material/mwc-switch'
import '@material/mwc-textfield'
import type { TextField } from '@material/mwc-textfield'
import { DataUiChannel } from '../../shared/channel'
import '../components/daq-color-box'

@customElement('view-plot-settings')
export class PlotSettingsElement extends connect(store, LitElement) {
	@state() channels: DataUiChannel[] = []
	@state() dataSeries: PlotDataSeries[] = []
	@state() plotVariation: PlotVariation = PlotVariation.SeparateAxes
	@state() plotTitle: string = ''
	@state() yAxes: YAxis[] = []
	@state() tooltipEnabled: boolean = false

	@query('#labelmenu')
	private labelMenu!: Menu
	private labelDataSeriesTarget?: number

	@query('#axistypemenu')
	private axisTypeMenu!: Menu

	private _setDataSeriesLabels(selectedAction: number) {
		if (this.labelDataSeriesTarget === undefined) {
			for (let i = 0; i < this.dataSeries.length; i++) {
				const ch = this.dataSeries[i].channel
				const label = selectedAction === 0 ? ch.name : ch.description ?? ''
				this._setDataSeriesLabel(i, label)
			}
		} else {
			const ch = this.dataSeries[this.labelDataSeriesTarget].channel
			const label = selectedAction === 0 ? ch.name : ch.description ?? ''
			this._setDataSeriesLabel(this.labelDataSeriesTarget, label)
		}
	}

	private _setDataSeriesLabel(index: number, label: string) {
		store.dispatch.plot.changeDataSeriesLabel({
			index,
			label,
		})
	}

	mapState(state: AppState) {
		return {
			channels: plotSelectors.channels(state),
			dataSeries: plotSelectors.plotDataSeries(state),
			plotVariation: plotSelectors.plotVariation(state),
			plotTitle: plotSelectors.plotTitle(state),
			tooltipEnabled: plotSelectors.tooltipEnabled(state),
			yAxes: plotSelectors.yAxes(state),
		}
	}

	private _renderPlotSettings() {
		return html`<section>
			<h2>Plot settings</h2>
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
			<mwc-select
				label="Plot variation"
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
			<mwc-formfield label="Display tooltip">
				<mwc-switch
					?selected=${this.tooltipEnabled}
					@click=${(e: Event) => {
						const s: Switch = e.target as Switch
						store.dispatch.plot.setTooltipEnabled(s.selected)
					}}
				></mwc-switch>
			</mwc-formfield>
		</section>`
	}

	private _renderDataSeriesSettings() {
		return html`
			<section>
				<h2>Data series and axes</h2>
				<mwc-menu
					absolute
					id="labelmenu"
					@action=${(e: CustomEvent<ActionDetail>) => {
						const { index } = e.detail
						this._setDataSeriesLabels(index)
					}}
				>
					<mwc-list-item>Use name</mwc-list-item>
					<mwc-list-item>Use description</mwc-list-item>
				</mwc-menu>
				<mwc-menu
					absolute
					id="axistypemenu"
					@action=${(e: CustomEvent<ActionDetail>) => {
						const selectedType = e.detail.index
						const type: YAxisType =
							selectedType === 0 ? 'linear' : 'logarithmic'
						for (let index = 0; index < this.dataSeries.length; index++) {
							store.dispatch.plot.setAxisType({ index, type })
						}
					}}
				>
					<mwc-list-item>All linear</mwc-list-item>
					<mwc-list-item>All logarithmic</mwc-list-item>
				</mwc-menu>
				<div id="axeslist" class="fullwidth text-small">
					<div class="bg-primary fg-on-primary px-8 py-2 text-centered">
						Color
					</div>
					<div class="bg-primary fg-on-primary px-8 py-2 text-centered">
						Channel
					</div>
					<div class="bg-primary fg-on-primary px-8 py-2 text-centered">
						Backend
					</div>
					<div class="bg-primary fg-on-primary px-8 py-2 text-centered">
						Label
						<span
							class="minibutton"
							@click=${(e: Event) => {
								this.labelDataSeriesTarget = undefined
								this.labelMenu.anchor = e.target as HTMLElement
								this.labelMenu.show()
							}}
						>
							...
						</span>
					</div>
					<div class="bg-primary fg-on-primary px-8 py-2 text-centered">
						Axis type
						<span
							class="minibutton"
							@click=${(e: Event) => {
								this.axisTypeMenu.anchor = e.target as HTMLElement
								this.axisTypeMenu.show()
							}}
						>
							...
						</span>
					</div>
					<div class="bg-primary fg-on-primary px-8 py-2 text-centered">
						Scaling
					</div>
					${this.dataSeries.map((x, idx) => {
						const yAxis = this.yAxes[x.yAxisIndex]
						return html`
							<div class="px-2 text-centered">
								<daq-color-box .index=${idx}></daq-color-box>
							</div>
							<div class="px-2">
								${x.channel.name}<br /><span class="opacity-70 text-smallest"
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
										this._setDataSeriesLabel(idx, v)
									}}
								></mwc-textfield>
								<mwc-icon-button
									icon="more_horiz"
									@click=${(e: Event) => {
										this.labelDataSeriesTarget = idx
										this.labelMenu.anchor = e.target as HTMLElement
										this.labelMenu.show()
									}}
								></mwc-icon-button>
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
			</section>
		`
	}

	render() {
		return html` ${this._renderPlotSettings()}
		${this._renderDataSeriesSettings()}`
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
					display: grid;
					grid-template-columns: auto 1fr auto 1fr auto auto;
					grid-template-rows: auto;
					gap: 2px;
					align-items: center;
				}
				.minibutton {
					cursor: pointer;
					border: 1px solid var(--dui-on-primary);
					margin: 2px;
					padding: 1px;
					border-radius: 2px;
				}
				section {
					display: grid;
					grid-template-columns: 1fr;
					grid-template-rows: auto;
					gap: 4px;
				}
			`,
		]
	}
}
