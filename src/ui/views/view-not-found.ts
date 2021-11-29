import { customElement, html, LitElement } from 'lit-element'
import { baseStyles } from '../shared-styles'

@customElement('view-not-found')
export class ViewNotFoundElement extends LitElement {
	render() {
		return html`<h1>View not found</h1>
			<p>Why don't you start over at the <a href="/">home page</a>?</p>`
	}

	static get styles() {
		return [baseStyles]
	}
}
