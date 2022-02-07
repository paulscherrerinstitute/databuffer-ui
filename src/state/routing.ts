import createMatcher, { Routes } from '@captaincodeman/router'
import { routingPlugin, withQuerystring } from '@captaincodeman/rdx'

export enum ROUTE {
	HOME = 'home',
	CHANNEL_INFO = 'channel-info',
	CHANNEL_SEARCH = 'channel-search',
	CORRELATION_PLOT = 'correlation-plot',
	PRESELECT = 'preselect',
	INDEX_PLOT = 'index-plot',
	PLOT = 'plot',
	PLOT_SINGLE_CHANEL = 'plot-single-channel',
	PLOT_SETTINGS = 'plot-settings',
	NOT_FOUND = 'not-found',
}

const routes: Routes<ROUTE> = {
	'/': ROUTE.HOME,
	'/channel-info': ROUTE.CHANNEL_INFO,
	'/search': ROUTE.CHANNEL_SEARCH,
	'/correlation-plot': ROUTE.CORRELATION_PLOT,
	'/preselect': ROUTE.PRESELECT,
	'/index-plot': ROUTE.INDEX_PLOT,
	'/plot': ROUTE.PLOT,
	'/plot/:backend/:name': ROUTE.PLOT_SINGLE_CHANEL,
	'/plot-settings': ROUTE.PLOT_SETTINGS,
	'/*': ROUTE.NOT_FOUND,
}
const matcher = createMatcher(routes)
export const routing = routingPlugin(matcher, { transform: withQuerystring })
