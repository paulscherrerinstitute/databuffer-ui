import { QueryRest } from '@psi/databuffer-queryrest'
import { QueryResponseItem as ChannelNamesResponseItem } from '@psi/databuffer-queryrest/query-channel-names/response'
import { QueryResponseItem as ChannelDataResponseItem } from '@psi/databuffer-queryrest/query-data/response'
export type ChannelDataResponse = ChannelDataResponseItem[]
export type ChannelNamesResponse = ChannelNamesResponseItem[]
export const queryRestApi = new QueryRest(window.DatabufferUi.QUERY_API)
