import { QueryRest } from '@psi/databuffer-query-js'
import { QueryResponseItem as ChannelNamesResponseItem } from '@psi/databuffer-query-js/query-channel-names/response'
import { QueryResponseItem as ChannelDataResponseItem } from '@psi/databuffer-query-js/query-data/response'
export type ChannelDataResponse = ChannelDataResponseItem[]
export type ChannelNamesResponse = ChannelNamesResponseItem[]
export const queryRestApi = new QueryRest(window.DatabufferUi.QUERY_API)
