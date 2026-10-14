export type CoreWebVital = 'lcp' | 'cls' | 'inp'

export interface FieldSource {
  provider: 'CrUX'
  scope: 'url' | 'origin'
  url: string
  device: 'mobile' | 'desktop' | 'tablet' | 'all'
  collectionPeriod: { _tag: 'Dates', start: string, end: string } | { _tag: 'Rolling', days: 28 }
}

export interface FieldMeasurements {
  lcp?: number | null
  cls?: number | null
  inp?: number | null
}

interface FieldCoverage {
  goodMetricCount: number
  measuredMetricCount: number
  missingMetrics: CoreWebVital[]
}

export type FieldAssessment
  = | (FieldCoverage & { _tag: 'Passed' | 'Failed' })
    | (FieldCoverage & { _tag: 'Unavailable', reason: 'missing-required-metrics' | 'unknown-rating' })

export type FieldRating = 'good' | 'needs-improvement' | 'poor' | 'unknown'

/** Provider ratings avoid assuming the numeric encoding of another API's measurements. */
export function assessFieldCoreWebVitalRatings(ratings: Partial<Record<CoreWebVital, FieldRating>>): FieldAssessment {
  const measured = coreWebVitals.filter(metric => ratings[metric] !== undefined)
  const missingMetrics = coreWebVitals.filter(metric => !measured.includes(metric))
  const goodMetricCount = measured.filter(metric => ratings[metric] === 'good').length
  const coverage = { goodMetricCount, measuredMetricCount: measured.length, missingMetrics }
  if (!measured.includes('lcp') || !measured.includes('cls'))
    return { _tag: 'Unavailable', reason: 'missing-required-metrics', ...coverage }
  if (measured.some(metric => ratings[metric] === 'unknown'))
    return { _tag: 'Unavailable', reason: 'unknown-rating', ...coverage }
  return { _tag: goodMetricCount === measured.length ? 'Passed' : 'Failed', ...coverage }
}

const goodThresholds = { lcp: 2500, cls: 0.1, inp: 200 } as const
const coreWebVitals: CoreWebVital[] = ['lcp', 'cls', 'inp']

/** Assess eligible field p75 values. Lab measurements must never enter this assessment. */
export function assessFieldCoreWebVitals(measurements: FieldMeasurements): FieldAssessment {
  const measured = coreWebVitals.filter(metric => Number.isFinite(measurements[metric]) && Number(measurements[metric]) >= 0)
  const missingMetrics = coreWebVitals.filter(metric => !measured.includes(metric))
  const goodMetricCount = measured.filter(metric => Number(measurements[metric]) <= goodThresholds[metric]).length
  const coverage = { goodMetricCount, measuredMetricCount: measured.length, missingMetrics }
  if (!measured.includes('lcp') || !measured.includes('cls'))
    return { _tag: 'Unavailable', reason: 'missing-required-metrics', ...coverage }
  return { _tag: goodMetricCount === measured.length ? 'Passed' : 'Failed', ...coverage }
}
