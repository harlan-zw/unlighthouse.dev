import type { FieldAssessment, FieldSource } from '~~/shared/field-assessment'
import type { FormFactor, NormalizedCrUXCurrentResult, NormalizedCrUXHistoryResult } from '../../utils/crux'
import { assessFieldCoreWebVitals } from '~~/shared/field-assessment'
import { fetchCrUXCurrent, fetchCrUXHistory, normaliseCruxHistory, normalizeCruxCurrent } from '../../utils/crux'

export interface CWVCompareRequest {
  urls: string[]
  formFactor?: FormFactor
  includeHistory?: boolean
}

export interface ComparisonMetric {
  p75: number
  good: number
  needsImprovement: number
  poor: number
  rating: 'good' | 'needs-improvement' | 'poor'
}

export interface SiteComparison {
  url: string
  normalizedUrl: string
  hasData: boolean
  current: NormalizedCrUXCurrentResult | null
  history: NormalizedCrUXHistoryResult[] | null
  assessment: FieldAssessment
  source: FieldSource | null
  cwvScore: number // 0-3, number of CWV metrics passed
}

export interface CWVCompareResponse {
  formFactor: FormFactor
  includeHistory: boolean
  comparisons: SiteComparison[]
  winners: {
    lcp: string | null
    cls: string | null
    inp: string | null
    fcp: string | null
    ttfb: string | null
    overall: string | null
    [key: string]: string | null
  }
  collectionPeriod: { start: string, end: string } | null
}

export default defineEventHandler(async (event): Promise<CWVCompareResponse> => {
  await checkFreeToolRateLimit(event)

  const body = await readBody<CWVCompareRequest>(event)

  const urls = body.urls || []
  if (urls.length < 2)
    throw createError({ statusCode: 400, message: 'At least 2 URLs are required' })
  if (urls.length > 4)
    throw createError({ statusCode: 400, message: 'Maximum 4 URLs allowed' })

  const normalizedUrls = urls.map((url) => {
    const trimmed = url.trim()
    const normalized = normalizeUrl(trimmed)
    if (!isValidUrl(normalized))
      throw createError({ statusCode: 400, message: `Invalid URL: ${trimmed}` })
    return { original: trimmed, normalized }
  })

  const formFactor = body.formFactor || 'PHONE'
  const includeHistory = body.includeHistory ?? true

  await trackToolUsage(event, 'cwv-compare', 'use')

  // Fetch CrUX data for all sites in parallel
  const fetchPromises = normalizedUrls.map(async ({ original, normalized }) => {
    const [currentResult, historyResult] = await Promise.all([
      fetchCrUXCurrent(event, normalized, 'origin', formFactor),
      includeHistory ? fetchCrUXHistory(event, normalized, 'origin', formFactor) : Promise.resolve(null),
    ])

    const current = currentResult?.record ? normalizeCruxCurrent(currentResult.record) : null
    const history = historyResult?.record ? normaliseCruxHistory(historyResult.record) : null

    const assessment = assessFieldCoreWebVitals({ lcp: current?.lcp?.p75, cls: current?.cls?.p75, inp: current?.inp?.p75 })
    const cwvScore = assessment.goodMetricCount
    const source: FieldSource | null = current && currentResult?.record
      ? {
          provider: 'CrUX',
          scope: 'origin',
          url: currentResult.record.key.origin || new URL(normalized).origin,
          device: formFactor === 'PHONE' ? 'mobile' : formFactor === 'TABLET' ? 'tablet' : formFactor === 'ALL_FORM_FACTORS' ? 'all' : 'desktop',
          collectionPeriod: { _tag: 'Dates', start: current.collectionStart, end: current.collectionEnd },
        }
      : null

    return {
      url: original,
      normalizedUrl: normalized,
      hasData: !!current,
      current,
      history,
      assessment,
      source,
      cwvScore,
    } satisfies SiteComparison
  })

  const comparisons = await Promise.all(fetchPromises)

  // Determine winners for each metric
  const winners = {
    lcp: null as string | null,
    cls: null as string | null,
    inp: null as string | null,
    fcp: null as string | null,
    ttfb: null as string | null,
    overall: null as string | null,
  }

  const metrics = ['lcp', 'cls', 'inp', 'fcp', 'ttfb'] as const

  for (const metric of metrics) {
    let bestValue = Number.POSITIVE_INFINITY
    let bestUrl: string | null = null

    for (const comp of comparisons) {
      const value = comp.current?.[metric]?.p75
      if (value !== undefined && value < bestValue) {
        bestValue = value
        bestUrl = comp.url
      }
    }

    winners[metric] = bestUrl
  }

  // Overall winner - highest cwvScore, then best average ranking
  const withData = comparisons.filter(c => c.hasData)
  if (withData.length > 0) {
    const sorted = [...withData].sort((a, b) => {
      // First by CWV score (higher is better)
      if (b.cwvScore !== a.cwvScore)
        return b.cwvScore - a.cwvScore

      // Then by sum of rankings (lower is better)
      const scoreA = metrics.reduce((sum, m) => {
        const val = a.current?.[m]?.p75
        return val !== undefined ? sum + val : sum + 999999
      }, 0)
      const scoreB = metrics.reduce((sum, m) => {
        const val = b.current?.[m]?.p75
        return val !== undefined ? sum + val : sum + 999999
      }, 0)
      return scoreA - scoreB
    })
    winners.overall = sorted[0]?.url || null
  }

  // Get collection period from first site with data
  const firstWithData = comparisons.find(c => c.current)
  const collectionPeriod = firstWithData?.current
    ? { start: firstWithData.current.collectionStart, end: firstWithData.current.collectionEnd }
    : null

  return {
    formFactor,
    includeHistory,
    comparisons,
    winners,
    collectionPeriod,
  }
})
