// CWV thresholds from web.dev
export const metricDefinitions = {
  lcp: {
    name: 'Largest Contentful Paint',
    abbr: 'LCP',
    unit: 'ms',
    good: 2500,
    poor: 4000,
    description: 'Measures loading performance. A good LCP should occur within 2.5 seconds.',
    learnMoreUrl: '/glossary/lcp',
    toolUrl: '/tools/lcp-finder',
  },
  cls: {
    name: 'Cumulative Layout Shift',
    abbr: 'CLS',
    unit: '',
    good: 0.1,
    poor: 0.25,
    description: 'Measures visual stability. A good CLS should be less than 0.1.',
    learnMoreUrl: '/glossary/cls',
    toolUrl: '/tools/cls-debugger',
  },
  inp: {
    name: 'Interaction to Next Paint',
    abbr: 'INP',
    unit: 'ms',
    good: 200,
    poor: 500,
    description: 'Measures responsiveness. A good INP should be less than 200ms.',
    learnMoreUrl: '/glossary/inp',
    toolUrl: '/tools/inp-analyzer',
  },
  fcp: {
    name: 'First Contentful Paint',
    abbr: 'FCP',
    unit: 'ms',
    good: 1800,
    poor: 3000,
    description: 'Measures when first content appears. A good FCP should be under 1.8 seconds.',
    learnMoreUrl: '/glossary/fcp',
  },
  ttfb: {
    name: 'Time to First Byte',
    abbr: 'TTFB',
    unit: 'ms',
    good: 800,
    poor: 1800,
    description: 'Measures server response time. A good TTFB should be under 800ms.',
    learnMoreUrl: '/glossary/ttfb',
    toolUrl: '/tools/ttfb-checker',
  },
} as const

export type MetricKey = keyof typeof metricDefinitions
export type CruxRating = 'good' | 'needs-improvement' | 'poor'

export const cwvMetrics: MetricKey[] = ['lcp', 'cls', 'inp']
export const allMetrics: MetricKey[] = ['lcp', 'cls', 'inp', 'fcp', 'ttfb']

export function getMetricRating(metric: MetricKey, value: number): CruxRating {
  const def = metricDefinitions[metric]
  if (value <= def.good)
    return 'good'
  if (value <= def.poor)
    return 'needs-improvement'
  return 'poor'
}

export function formatCruxMetricValue(metric: MetricKey, value: number | undefined): string {
  if (value === undefined || value === null)
    return '-'
  if (metric === 'cls')
    return value.toFixed(2)
  if (value >= 1000)
    return `${(value / 1000).toFixed(1)}s`
  return `${Math.round(value)}ms`
}

export function getCruxRatingColor(rating: CruxRating): string {
  switch (rating) {
    case 'good':
      return 'text-green-500'
    case 'needs-improvement':
      return 'text-amber-500'
    case 'poor':
      return 'text-red-500'
    default:
      return 'text-gray-500'
  }
}

export function getCruxRatingBgColor(rating: CruxRating): string {
  switch (rating) {
    case 'good':
      return 'bg-green-500'
    case 'needs-improvement':
      return 'bg-amber-500'
    case 'poor':
      return 'bg-red-500'
    default:
      return 'bg-gray-500'
  }
}

export function getCruxRatingIcon(rating: CruxRating): string {
  switch (rating) {
    case 'good':
      return 'i-heroicons-check-circle'
    case 'needs-improvement':
      return 'i-heroicons-exclamation-triangle'
    case 'poor':
      return 'i-heroicons-x-circle'
    default:
      return 'i-heroicons-question-mark-circle'
  }
}

export function getPassesAllCWV(metrics: { lcp?: number, cls?: number, inp?: number }): boolean {
  const { lcp, cls, inp } = metrics
  if (lcp === undefined || cls === undefined || inp === undefined)
    return false
  return getMetricRating('lcp', lcp) === 'good'
    && getMetricRating('cls', cls) === 'good'
    && getMetricRating('inp', inp) === 'good'
}

export function calculateTrendPercentage(current: number | undefined, previous: number | undefined): number | null {
  if (!previous || previous === 0 || !current)
    return null
  return Math.round(((current - previous) / previous) * 1000) / 10
}
