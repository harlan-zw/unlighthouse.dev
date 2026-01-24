import type { FormFactor, NormalizedCrUXCurrentResult } from '~~/server/utils/crux'
import type { MetricKey } from '~/utils/crux'
import { fetchCrUXCurrent, normalizeCruxCurrent } from '~~/server/utils/crux'

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

  // Try URL-level first, fallback to origin
  let result = await fetchCrUXCurrent(event, url, 'url', formFactor)
  if (!result)
    result = await fetchCrUXCurrent(event, url, 'origin', formFactor)

  if (!result)
    throw createError({ statusCode: 404, message: 'No CrUX data available' })

  const normalized = normalizeCruxCurrent(result.record)
  const metricData = normalized[metric as keyof NormalizedCrUXCurrentResult] as { p75: number, good: number, needsImprovement: number, poor: number } | undefined

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
    collectionStart: normalized.collectionStart,
    collectionEnd: normalized.collectionEnd,
  }
})
