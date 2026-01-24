import type { FormFactor, NormalizedCrUXHistoryResult } from '../../utils/crux'
import { trackToolLookup, trackToolUsage } from '../../utils/analytics'
import { fetchCrUXHistory, normaliseCruxHistory } from '../../utils/crux'
import { checkFreeToolRateLimit } from '../../utils/rate-limit'
import { isValidUrl, normalizeUrl } from '../../utils/url'

export interface CWVHistoryResponse {
  url: string
  mode: 'origin' | 'url'
  formFactor: FormFactor
  hasData: boolean
  history: NormalizedCrUXHistoryResult[] | null
  key?: { origin?: string, url?: string, formFactor: string }
}

export default defineEventHandler(async (event): Promise<CWVHistoryResponse> => {
  await checkFreeToolRateLimit(event)

  const body = await readBody<{
    url?: string
    mode?: 'origin' | 'url'
    formFactor?: FormFactor
  }>(event)

  const url = body.url?.trim()
  if (!url)
    throw createError({ statusCode: 400, message: 'URL is required' })

  const normalized = normalizeUrl(url)
  if (!isValidUrl(normalized))
    throw createError({ statusCode: 400, message: 'Invalid URL format' })

  const mode = body.mode || 'origin'
  const formFactor = body.formFactor || 'PHONE'

  await trackToolUsage(event, 'cwv-history', 'use')
  await trackToolLookup(event, 'cwv-history', normalized, formFactor)

  const result = await fetchCrUXHistory(event, normalized, mode, formFactor)

  if (!result?.record) {
    return {
      url: normalized,
      mode,
      formFactor,
      hasData: false,
      history: null,
    }
  }

  const history = normaliseCruxHistory(result.record)

  return {
    url: normalized,
    mode,
    formFactor,
    hasData: history.length > 0,
    history: history.length > 0 ? history : null,
    key: result.record.key,
  }
})
