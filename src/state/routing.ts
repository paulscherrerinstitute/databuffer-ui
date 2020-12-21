import createMatcher, { Routes } from '@captaincodeman/router'
import { routingPlugin, withQuerystring } from '@captaincodeman/rdx'

export enum ROUTE {
	HOME = 'home',
	CHANNEL_SEARCH = 'channel-search',
	PRESELECT = 'preselect',
	PLOT = 'plot',
	PLOT_SINGLE_CHANEL = 'plot-single-channel',
	PLOT_SETTINGS = 'plot-settings',
	QUERY_META = 'query-meta',
	NOT_FOUND = 'not-found',
}

const routes: Routes<ROUTE> = {
	'/': ROUTE.HOME,
	'/search': ROUTE.CHANNEL_SEARCH,
	'/preselect': ROUTE.PRESELECT,
	'/plot': ROUTE.PLOT,
	'/plot/:backend/:name': ROUTE.PLOT_SINGLE_CHANEL,
	'/plot-settings': ROUTE.PLOT_SETTINGS,
	'/query-meta': ROUTE.QUERY_META,
	'/*': ROUTE.NOT_FOUND,
}
const matcher = createMatcher(routes)
export const routing = routingPlugin(matcher, { transform: withQuerystring })
