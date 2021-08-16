// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../ui/global.d.ts" />

import { QueryRest } from '@paulscherrerinstitute/databuffer-query-js/api/v0'
import type {
	DataResponse,
	ChannelNamesResponse,
} from '@paulscherrerinstitute/databuffer-query-js/api/v0'
export type { DataResponse, ChannelNamesResponse }
export const queryRestApi = new QueryRest(window.DatabufferUi.QUERY_API)
