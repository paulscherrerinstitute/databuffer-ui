import { LitElement, html, css } from 'lit'
import { customElement } from 'lit/decorators.js'
import './app-router'
import '@material/mwc-icon-button'
import '@material/mwc-top-app-bar-fixed'

import './app-bar-action-items'
import './app-bar-nav-icon'
import './app-bar-title'

@customElement('app-shell')
export class AppShellElement extends LitElement {
	render() {
		return html`<mwc-top-app-bar-fixed dense>
			<app-bar-nav-icon slot="navigationIcon"></app-bar-nav-icon>
			<app-bar-title slot="title"></app-bar-title>
			<app-bar-action-items slot="actionItems"></app-bar-action-items>
			<app-router></app-router>
		</mwc-top-app-bar-fixed> `
	}

	static get styles() {
		return css`
			:host {
				display: block;
				height: 100%;
			}
			mwc-top-app-bar-fixed {
				height: 100%;
			}
		`
	}
}
