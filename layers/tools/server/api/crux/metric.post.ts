import type { MetricKey } from '../../../app/utils/crux'
import type { FormFactor, NormalizedCrUXCurrentResult } from '../../utils/crux'
import { fetchCrUXCurrent, normalizeCruxCurrent } from '../../utils/crux'

export interface CruxMetricRequest {
  url: string
  metric: MetricKey
  formFactor: FormFactor
}

export interface CruxMetricResponse {
  p75: number
  displayValue: string
  rating: 'good' | 'needs-improvement' | 'poor'
  histogram: { good: number, needsImprovement: number, poor: number }
  collectionStart: string
  collectionEnd: string
}

const thresholds: Record<MetricKey, { good: number, poor: number }> = {
  lcp: { good: 2500, poor: 4000 },
  cls: { good: 0.1, poor: 0.25 },
  inp: { good: 200, poor: 500 },
  fcp: { good: 1800, poor: 3000 },
  ttfb: { good: 800, poor: 1800 },
  si: { good: 3400, poor: 5800 },
  tbt: { good: 200, poor: 600 },
}

function getRating(metric: MetricKey, value: number): 'good' | 'needs-improvement' | 'poor' {
  const { good, poor } = thresholds[metric]
  if (value <= good)
    return 'good'
  if (value <= poor)
    return 'needs-improvement'
  return 'poor'
}

function formatValue(metric: MetricKey, value: number): string {
  if (metric === 'cls')
    return value.toFixed(2)
  if (value >= 1000)
    return `${(value / 1000).toFixed(1)}s`
  return `${Math.round(value)}ms`
}

export default defineEventHandler(async (event): Promise<CruxMetricResponse> => {
  const { url, metric, formFactor } = await readBody<CruxMetricRequest>(event)

  if (!url || !metric)
    throw createError({ statusCode: 400, message: 'URL and metric required' })

  const normalized = normalizeUrl(url)
  if (!isValidUrl(normalized))
    throw createError({ statusCode: 400, message: 'Invalid URL format' })

  // Try URL-level first, fallback to origin
  let result = await fetchCrUXCurrent(event, normalized, 'url', formFactor)
  if (!result)
    result = await fetchCrUXCurrent(event, normalized, 'origin', formFactor)

  if (!result)
    throw createError({ statusCode: 404, message: 'No CrUX data available' })

  const cruxData = normalizeCruxCurrent(result.record)
  const metricData = cruxData[metric as keyof NormalizedCrUXCurrentResult] as { p75: number, good: number, needsImprovement: number, poor: number } | undefined

  if (!metricData)
    throw createError({ statusCode: 404, message: `No ${metric.toUpperCase()} data available` })

  return {
    p75: metricData.p75,
    displayValue: formatValue(metric, metricData.p75),
    rating: getRating(metric, metricData.p75),
    histogram: {
      good: Math.round(metricData.good * 100),
      needsImprovement: Math.round(metricData.needsImprovement * 100),
      poor: Math.round(metricData.poor * 100),
    },
    collectionStart: cruxData.collectionStart,
    collectionEnd: cruxData.collectionEnd,
  }
})
