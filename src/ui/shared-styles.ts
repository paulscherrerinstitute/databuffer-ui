import { css } from 'lit-element'

export const debugNesting = css`
	:host {
		background-color: #ff0000;
	}
	:host > * {
		background-color: #ffff00;
	}
	:host > * > * {
		background-color: #00ff00;
	}
	:host > * > * > * {
		background-color: #00ffff;
	}
	:host > * > * > * > * {
		background-color: #0000ff;
	}
	:host > * > * > * > * > * {
		background-color: #ff00ff;
	}
`
