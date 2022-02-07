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

export const shadowHelpers = css`
	.shadow {
		box-shadow: rgba(0, 0, 0, 0.2) 0px 2px 4px -1px,
			rgba(0, 0, 0, 0.14) 0px 4px 5px 0px, rgba(0, 0, 0, 0.12) 0px 1px 10px 0px;
		border-radius: 2px;
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

export const sizeHelpers = css`
	.fullwidth {
		width: 100%;
	}
	.fullheight {
		height: 100%;
	}
`

export const paddingHelpers = css`
	.px-2 {
		padding-left: 2px;
		padding-right: 2px;
	}
	.px-4 {
		padding-left: 4px;
		padding-right: 4px;
	}
	.px-8 {
		padding-left: 8px;
		padding-right: 8px;
	}
	.py-2 {
		padding-top: 2px;
		padding-bottom: 2px;
	}
	.py-4 {
		padding-top: 4px;
		padding-bottom: 4px;
	}
	.py-8 {
		padding-top: 8px;
		padding-bottom: 8px;
	}
	.p-2 {
		padding: 2px;
	}
	.p-4 {
		padding: 4px;
	}
	.p-8 {
		padding: 8px;
	}
`

export const colorHelpers = css`
	.bg-primary {
		background-color: var(--dui-primary);
	}
	.bg-secondary {
		background-color: var(--dui-secondary);
	}
	.fg-primary {
		color: var(--dui-primary);
	}
	.fg-secondary {
		color: var(--dui-secondary);
	}
	.fg-on-primary {
		color: var(--dui-on-primary);
	}
	.fg-on-secondary {
		color: var(--dui-on-secondary);
	}
`

export const flexHelpers = css`
	.flex-col {
		display: flex;
		flex-direction: row;
	}
	.flex-row {
		display: flex;
		flex-direction: row;
	}
	.flex-grow {
		flex-grow: 1;
	}
	.flex-shrink {
		flex-shrink: 1;
	}
`
