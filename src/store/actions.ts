// see: https://medium.com/@martin_hotell/improved-redux-type-safety-with-typescript-2-8-2c11a8062575

export interface Action<T extends string> {
	type: T
}

export interface ActionWithPayload<T extends string, P> extends Action<T> {
	payload: P
}

export function createAction<T extends string>(type: T): Action<T>
export function createAction<T extends string, P>(
	type: T,
	payload: P
): ActionWithPayload<T, P>
export function createAction<T extends string, P>(
	type: T,
	payload?: P
): Action<T> | ActionWithPayload<T, P> {
	return payload === undefined ? { type } : { type, payload }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FunctionType = (...args: any[]) => any
type ActionCreatorsMapObject = { [actioncreator: string]: FunctionType }

export type ActionsUnion<A extends ActionCreatorsMapObject> = ReturnType<
	A[keyof A]
>
