// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../ui/global.d.ts" />

import { QueryRest } from '@psi/databuffer-query-js'
import type {
	DataResponse,
	ChannelNamesResponse,
} from '@psi/databuffer-query-js'
export type { DataResponse, ChannelNamesResponse }
export const queryRestApi = new QueryRest(window.DatabufferUi.QUERY_API)
