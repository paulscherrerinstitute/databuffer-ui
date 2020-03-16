import { createSelector } from 'reselect'

import { Channel } from './model'
import { RootState } from '../reducer'

const getState = (state: RootState) => state.channelSearch

const compareNameThenBackend = (a: Channel, b: Channel): number => {
	if (a.name < b.name) return -1
	if (a.name > b.name) return 1
	if (a.backend < b.backend) return -1
	if (a.backend > b.backend) return 1
	return 0
}

export const pattern = createSelector([getState], state => state.pattern)

export const availableBackends = createSelector(
	[getState],
	state => state.availableBackends
)

export const selectedBackends = createSelector(
	[getState],
	state => state.selectedBackends
)

const resultEntities = createSelector([getState], state => state.entities)

export const results = createSelector([resultEntities], entities =>
	Object.values(entities).sort(compareNameThenBackend)
)

export const resultsWithTags = createSelector([results], results =>
	results.map(x => ({ ...x, tags: [x.backend] }))
)

export const availableTags = createSelector(
	[resultsWithTags],
	resultsWithTags =>
		resultsWithTags.reduce(
			(aggr, current) => [
				...aggr,
				...current.tags.filter(t => !aggr.includes(t)),
			],
			[]
		)
)

export const fetching = createSelector([getState], state => state.fetching)

export const error = createSelector([getState], state => state.error)
