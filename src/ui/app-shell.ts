import { LitElement, customElement, html, css } from 'lit-element'
import './app-router'

@customElement('app-shell')
export class AppShellElement extends LitElement {
	render() {
		return html`
			<app-router></app-router>
		`
	}

	static get styles() {
		return css`
			:host {
				display: block;
				height: 100%;
			}
		`
	}
}
