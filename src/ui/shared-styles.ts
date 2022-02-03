import { css } from 'lit'

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

export const baseStyles = css`
	:host {
		display: block;
		box-sizing: border-box;
		margin: 0;
		padding: 0;
	}

	:host([hidden]) {
		display: none;
	}
`

export const mwcCheckboxPrimaryColor = css`
	mwc-checkbox {
		--mdc-theme-secondary: var(--mdc-theme-primary);
	}
`

export const textHelpers = css`
	.text-small {
		font-size: 10pt;
	}

	.text-smallest {
		font-size: 8pt;
	}

	.text-bold {
		font-weight: bold;
	}

	.text-centered {
		text-align: center;
	}

	.text-left {
		text-align: start;
	}

	.text-right {
		text-align: end;
	}
`

export const opacityHelpers = css`
	.opacity-70 {
		opacity: 70%;
	}
	.opacity-50 {
		opacity: 50%;
	}
	.opacity-30 {
		opacity: 30%;
	}
`
