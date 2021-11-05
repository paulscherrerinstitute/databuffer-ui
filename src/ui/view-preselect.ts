import { customElement, css, html, LitElement } from 'lit-element'
import { baseStyles } from './shared-styles'

@customElement('view-preselect')
export class ViewPreselectElement extends LitElement {
	render() {
		return html`<h1>Preselection loading</h1>
			<p>
				Please wait, while the UI is gathering meta data about your channels and
				preparing the plot.
			</p>`
	}

	static get styles() {
		return [
			baseStyles,
			css`
				:host {
					padding: 8px;
				}
			`,
		]
	}
}
