import createMatcher from '@captaincodeman/router'
import { routingPlugin } from '@captaincodeman/rdx'
import * as models from './models'

const routes = {
	'/': 'home',
	'/search': 'channel-search',
	'/preselect': 'preselect',
	'/plot': `plot`,
	'/plot/:backend/:name': `plot-single-channel`,
	'/plot-settings': `plot-settings`,
	'/query-meta': `query-meta`,
	'/*': 'not-found',
}
const matcher = createMatcher(routes)
const routing = routingPlugin(matcher)

export const config = { models, plugins: { routing } }
