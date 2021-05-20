import { ModelStore, Model, EffectFns } from '@captaincodeman/rdx'

/**
 * Create a deep copy of an object. This is a convenience for creating
 * copies of state trees for testing.
 *
 * As a state tree should ideally be a JSON serializable object, only
 * the following types of child elements are supported:
 * undefined, null, boolean, number, string, array, and object.
 *
 * @param obj The object to be deeply copied
 */
export const deepCopyState = <T>(obj: T): T => {
	if (obj === undefined) return obj
	if (obj === null) return obj
	if (typeof obj === 'boolean') return obj
	if (typeof obj === 'number') return obj
	if (typeof obj === 'string') return obj
	if (typeof obj === 'bigint')
		throw new Error('Your state should not contain bigint')
	if (typeof obj === 'symbol')
		throw new Error('Your state should not contain Symbols')
	if (typeof obj === 'function')
		throw new Error('Your state should not contain functions')
	if (obj instanceof Array) {
		return obj.map(x => deepCopyState(x)) as unknown as T
	}
	if (typeof obj === 'object') {
		// need to do a few casts to do this type trickery for TS
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = { ...obj } as { [key: string]: any }
		for (const k of Object.keys(obj)) {
			result[k] = deepCopyState(result[k])
		}
		return result as T
	}
	throw new Error(
		'deepCopyState did not branch into a return statement! typeof obj: ' +
			typeof obj
	)
}

export interface RdxTestEnv<S, D> {
	state: S
	dispatch: D
	modelStore: ModelStore<D, S>
	modelEffects: <M extends Model>(model: M) => EffectFns
	cleanup: () => void
}

/**
 * Create an isolated test environment for a store.
 * The store's state is substituted by a deep copy. You need to
 * restore it back to its original state by calling `cleanup`
 * (e.g. in an `afterEach` handler of your testing framework).
 *
 * @param store The store for which the test environment is created.
 */
export const createTestEnv = <S, D>(store: {
	dispatch: D
	state: S
}): RdxTestEnv<S, D> => {
	const dispatch = store.dispatch
	const originalState = store.state
	const state = deepCopyState(originalState)
	store.state = state
	const modelStore = {
		getDispatch: () => dispatch,
		getState: () => state,
	}
	const cleanup = () => {
		store.state = originalState
	}
	return {
		state,
		dispatch,
		modelStore,
		modelEffects(model: Model): EffectFns {
			if (model.effects === undefined)
				throw new Error('Model does not provide effects')
			return model.effects(modelStore)
		},
		cleanup,
	}
}
