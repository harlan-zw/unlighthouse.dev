import type { FormFactor, NormalizedCrUXHistoryResult } from '../../utils/crux'
import { trackToolLookup, trackToolUsage } from '../../utils/analytics'
import { fetchCrUXCurrent, fetchCrUXHistory, normaliseCruxHistory, normalizeCruxCurrent } from '../../utils/crux'
import { fetchPSI } from '../../utils/psi'
import { checkFreeToolRateLimit } from '../../utils/rate-limit'
import { isValidUrl, normalizeUrl } from '../../utils/url'

export interface TTFBCheckResponse {
  url: string
  mode: 'origin' | 'url'
  formFactor: FormFactor
  hasFieldData: boolean

  field: {
    ttfb: {
      p75: number
      displayValue: string
      rating: 'good' | 'needs-improvement' | 'poor'
      histogram: { good: number, needsImprovement: number, poor: number }
    }
    collectionPeriod: { start: string, end: string }
  } | null

  lab: {
    ttfb: {
      value: number
      displayValue: string
      score: number
    }
    serverResponseTime: {
      value: number
      displayValue: string
    }
  } | null

  history: NormalizedCrUXHistoryResult[] | null
}

function formatTTFB(ms: number): string {
  if (ms >= 1000)
    return `${(ms / 1000).toFixed(2)}s`
  return `${Math.round(ms)}ms`
}

function getTTFBRating(ms: number): 'good' | 'needs-improvement' | 'poor' {
  if (ms <= 800)
    return 'good'
  if (ms <= 1800)
    return 'needs-improvement'
  return 'poor'
}

export default defineEventHandler(async (event): Promise<TTFBCheckResponse> => {
  await checkFreeToolRateLimit(event)

  const body = await readBody<{
    url?: string
    mode?: 'origin' | 'url'
    formFactor?: FormFactor
    includeHistory?: boolean
    includeLab?: boolean
  }>(event)

  const url = body.url?.trim()
  if (!url)
    throw createError({ statusCode: 400, message: 'URL is required' })

  const normalized = normalizeUrl(url)
  if (!isValidUrl(normalized))
    throw createError({ statusCode: 400, message: 'Invalid URL format' })

  const mode = body.mode || 'origin'
  const formFactor = body.formFactor || 'PHONE'
  const includeHistory = body.includeHistory !== false
  const includeLab = body.includeLab !== false

  await trackToolUsage(event, 'ttfb-checker', 'use')
  await trackToolLookup(event, 'ttfb-checker', normalized, formFactor === 'DESKTOP' ? 'desktop' : 'mobile')

  // Fetch CrUX current data
  const cruxCurrentPromise = fetchCrUXCurrent(event, normalized, mode, formFactor)

  // Fetch CrUX history if requested
  const cruxHistoryPromise = includeHistory
    ? fetchCrUXHistory(event, normalized, mode, formFactor)
    : Promise.resolve(null)

  // Fetch lab data if requested
  const labPromise = includeLab
    ? fetchPSI(event, normalized, formFactor === 'DESKTOP' ? 'desktop' : 'mobile').catch(() => null)
    : Promise.resolve(null)

  const [cruxCurrent, cruxHistoryResult, labResult] = await Promise.all([
    cruxCurrentPromise,
    cruxHistoryPromise,
    labPromise,
  ])

  // Process field data
  let field: TTFBCheckResponse['field'] = null
  if (cruxCurrent?.record) {
    const currentData = normalizeCruxCurrent(cruxCurrent.record)
    if (currentData.ttfb) {
      field = {
        ttfb: {
          p75: currentData.ttfb.p75,
          displayValue: formatTTFB(currentData.ttfb.p75),
          rating: getTTFBRating(currentData.ttfb.p75),
          histogram: {
            good: Math.round(currentData.ttfb.good * 100),
            needsImprovement: Math.round(currentData.ttfb.needsImprovement * 100),
            poor: Math.round(currentData.ttfb.poor * 100),
          },
        },
        collectionPeriod: {
          start: currentData.collectionStart,
          end: currentData.collectionEnd,
        },
      }
    }
  }

  // Process history data
  let history: NormalizedCrUXHistoryResult[] | null = null
  if (cruxHistoryResult?.record) {
    const historyData = normaliseCruxHistory(cruxHistoryResult.record)
    history = historyData.length > 0 ? historyData : null
  }

  // Process lab data
  let lab: TTFBCheckResponse['lab'] = null
  if (labResult) {
    const audits = labResult.lighthouseResult.audits
    const serverResponseTime = audits['server-response-time']
    const ttfbValue = serverResponseTime?.numericValue || 0

    lab = {
      ttfb: {
        value: ttfbValue,
        displayValue: formatTTFB(ttfbValue),
        score: Math.round((serverResponseTime?.score || 0) * 100),
      },
      serverResponseTime: {
        value: serverResponseTime?.numericValue || 0,
        displayValue: serverResponseTime?.displayValue || formatTTFB(serverResponseTime?.numericValue || 0),
      },
    }
  }

  return {
    url: normalized,
    mode,
    formFactor,
    hasFieldData: field !== null,
    field,
    lab,
    history,
  }
})
