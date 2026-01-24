import type { FormFactor, NormalizedCrUXCurrentResult, NormalizedCrUXHistoryResult } from '../../utils/crux'
import { trackToolUsage } from '../../utils/analytics'
import { fetchCrUXCurrent, fetchCrUXHistory, normaliseCruxHistory, normalizeCruxCurrent } from '../../utils/crux'
import { checkFreeToolRateLimit } from '../../utils/rate-limit'
import { isValidUrl, normalizeUrl } from '../../utils/url'

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
  passesAllCWV: boolean
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
  }
  collectionPeriod: { start: string, end: string } | null
}

const thresholds = {
  lcp: { good: 2500, poor: 4000 },
  cls: { good: 0.1, poor: 0.25 },
  inp: { good: 200, poor: 500 },
  fcp: { good: 1800, poor: 3000 },
  ttfb: { good: 800, poor: 1800 },
}

function getRating(metric: keyof typeof thresholds, value: number): 'good' | 'needs-improvement' | 'poor' {
  if (value <= thresholds[metric].good)
    return 'good'
  if (value <= thresholds[metric].poor)
    return 'needs-improvement'
  return 'poor'
}

function passesMetric(metric: keyof typeof thresholds, value: number | undefined): boolean {
  return value !== undefined && value <= thresholds[metric].good
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

    // Calculate CWV pass score
    let cwvScore = 0
    if (current?.lcp && passesMetric('lcp', current.lcp.p75))
      cwvScore++
    if (current?.cls && passesMetric('cls', current.cls.p75))
      cwvScore++
    if (current?.inp && passesMetric('inp', current.inp.p75))
      cwvScore++

    const passesAllCWV = cwvScore === 3

    return {
      url: original,
      normalizedUrl: normalized,
      hasData: !!current,
      current,
      history,
      passesAllCWV,
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
