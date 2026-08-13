/**
 * Web Vitals thresholds and the CrUX field data PageSpeed Insights returns
 * alongside every lab run.
 *
 * Each tool handler used to carry its own copy of these, so a tool could only
 * show field data if someone remembered to paste the parser in. The INP
 * analyzer never had it, which meant the tool named after a field-only metric
 * answered with a lab proxy and never said so.
 */

export type MetricRating = 'good' | 'needs-improvement' | 'poor'

export interface FieldMetric {
  value: number
  displayValue: string
  rating: MetricRating
  percentiles: { good: number, needsImprovement: number, poor: number }
}

export interface FieldData {
  lcp: FieldMetric | null
  cls: FieldMetric | null
  inp: FieldMetric | null
  fcp: FieldMetric | null
  ttfb: FieldMetric | null
}

// Thresholds from web.dev.
export const WEB_VITALS_THRESHOLDS = {
  lcp: { good: 2500, poor: 4000 },
  cls: { good: 0.1, poor: 0.25 },
  inp: { good: 200, poor: 500 },
  fcp: { good: 1800, poor: 3000 },
  tbt: { good: 200, poor: 600 },
  ttfb: { good: 800, poor: 1800 },
  si: { good: 3400, poor: 5800 },
} as const

export type WebVitalMetric = keyof typeof WEB_VITALS_THRESHOLDS

export function getRating(value: number, metric: WebVitalMetric): MetricRating {
  const threshold = WEB_VITALS_THRESHOLDS[metric]
  if (value <= threshold.good)
    return 'good'
  if (value <= threshold.poor)
    return 'needs-improvement'
  return 'poor'
}

export function formatMetricValue(value: number, metric: string): string {
  if (metric === 'cls')
    return value.toFixed(3)
  if (value >= 1000)
    return `${(value / 1000).toFixed(1)} s`
  return `${Math.round(value)} ms`
}

interface CruxMetric {
  percentile?: number
  distributions?: Array<{ min?: number, max?: number, proportion?: number }>
  category?: string
}

/**
 * CrUX names its buckets FAST, AVERAGE and SLOW. Passing those through
 * lowercased, as the per-tool copies of this parser did, produced ratings of
 * `fast` and `slow` that no UI branch matches, so field ratings silently
 * rendered as neither good nor poor.
 */
const CRUX_CATEGORIES: Record<string, MetricRating> = {
  FAST: 'good',
  AVERAGE: 'needs-improvement',
  SLOW: 'poor',
  GOOD: 'good',
  NEEDS_IMPROVEMENT: 'needs-improvement',
  POOR: 'poor',
}

const CRUX_KEYS: Record<keyof FieldData, string> = {
  lcp: 'LARGEST_CONTENTFUL_PAINT_MS',
  cls: 'CUMULATIVE_LAYOUT_SHIFT_SCORE',
  inp: 'INTERACTION_TO_NEXT_PAINT',
  fcp: 'FIRST_CONTENTFUL_PAINT_MS',
  ttfb: 'EXPERIMENTAL_TIME_TO_FIRST_BYTE',
}

/**
 * Field data is absent for most URLs, because CrUX only reports origins with
 * enough real traffic. Absent is a real answer the tools must show, so this
 * returns null rather than an object of nulls dressed up as data.
 */
export function parseFieldData(loadingExperience: Record<string, unknown> | undefined | null): FieldData | null {
  const metrics = (loadingExperience as { metrics?: Record<string, CruxMetric> } | undefined | null)?.metrics
  if (!metrics)
    return null

  const parseMetric = (key: string, metric: WebVitalMetric): FieldMetric | null => {
    const raw = metrics[key]
    if (!raw || typeof raw.percentile !== 'number')
      return null

    const distributions = raw.distributions || []
    return {
      value: raw.percentile,
      displayValue: formatMetricValue(raw.percentile, metric),
      rating: CRUX_CATEGORIES[raw.category ?? ''] ?? getRating(raw.percentile, metric),
      percentiles: {
        good: Math.round((distributions[0]?.proportion || 0) * 100),
        needsImprovement: Math.round((distributions[1]?.proportion || 0) * 100),
        poor: Math.round((distributions[2]?.proportion || 0) * 100),
      },
    }
  }

  const field: FieldData = {
    lcp: parseMetric(CRUX_KEYS.lcp, 'lcp'),
    cls: parseMetric(CRUX_KEYS.cls, 'cls'),
    inp: parseMetric(CRUX_KEYS.inp, 'inp'),
    fcp: parseMetric(CRUX_KEYS.fcp, 'fcp'),
    ttfb: parseMetric(CRUX_KEYS.ttfb, 'ttfb'),
  }

  // A metrics object with nothing recognisable in it is the same as no field
  // data, and saying so keeps "we have data" from meaning "we have a shape".
  return Object.values(field).some(Boolean) ? field : null
}
