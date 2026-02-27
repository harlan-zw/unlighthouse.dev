// Lighthouse v10+ scoring math - ported from Google source
// https://github.com/GoogleChrome/lighthouse/blob/main/core/scoring.js

export type MetricId = 'FCP' | 'SI' | 'LCP' | 'TBT' | 'CLS'
export type Device = 'mobile' | 'desktop'
export type Rating = 'pass' | 'average' | 'fail'

export interface MetricCurve {
  median: number
  p10: number
}

export interface MetricDefinition {
  id: MetricId
  name: string
  weight: number
  curve: MetricCurve
  unit: 'ms' | 'unitless'
  color: string
  isCWV: boolean
  description: string
}

// Metric colors - violet brand with shade variations
const METRIC_COLORS: Record<MetricId, string> = {
  FCP: '#8b5cf6', // violet-500
  SI: '#a78bfa', // violet-400
  LCP: '#7c3aed', // violet-600
  TBT: '#6d28d9', // violet-700
  CLS: '#c4b5fd', // violet-300
}

// Lighthouse v10+ mobile scoring curves
const MOBILE_METRICS: Record<MetricId, Omit<MetricDefinition, 'color' | 'isCWV' | 'description'>> = {
  FCP: { id: 'FCP', name: 'First Contentful Paint', weight: 0.10, curve: { median: 3000, p10: 1800 }, unit: 'ms' },
  SI: { id: 'SI', name: 'Speed Index', weight: 0.10, curve: { median: 5800, p10: 3387 }, unit: 'ms' },
  LCP: { id: 'LCP', name: 'Largest Contentful Paint', weight: 0.25, curve: { median: 4000, p10: 2500 }, unit: 'ms' },
  TBT: { id: 'TBT', name: 'Total Blocking Time', weight: 0.30, curve: { median: 600, p10: 200 }, unit: 'ms' },
  CLS: { id: 'CLS', name: 'Cumulative Layout Shift', weight: 0.25, curve: { median: 0.25, p10: 0.1 }, unit: 'unitless' },
}

// Lighthouse v10+ desktop scoring curves
const DESKTOP_METRICS: Record<MetricId, Omit<MetricDefinition, 'color' | 'isCWV' | 'description'>> = {
  FCP: { id: 'FCP', name: 'First Contentful Paint', weight: 0.10, curve: { median: 1600, p10: 934 }, unit: 'ms' },
  SI: { id: 'SI', name: 'Speed Index', weight: 0.10, curve: { median: 2300, p10: 1311 }, unit: 'ms' },
  LCP: { id: 'LCP', name: 'Largest Contentful Paint', weight: 0.25, curve: { median: 2400, p10: 1200 }, unit: 'ms' },
  TBT: { id: 'TBT', name: 'Total Blocking Time', weight: 0.30, curve: { median: 350, p10: 150 }, unit: 'ms' },
  CLS: { id: 'CLS', name: 'Cumulative Layout Shift', weight: 0.25, curve: { median: 0.25, p10: 0.1 }, unit: 'unitless' },
}

const METRIC_DESCRIPTIONS: Record<MetricId, string> = {
  FCP: 'Time until first text or image is painted',
  SI: 'How quickly content visually populates',
  LCP: 'Time until largest content element is visible',
  TBT: 'Sum of blocking time for long tasks',
  CLS: 'Movement of visible elements during load',
}

const CWV_METRICS: MetricId[] = ['LCP', 'CLS']

// Gauss error function approximation
function internalErf(x: number): number {
  const sign = x < 0 ? -1 : 1
  x = Math.abs(x)

  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const p = 0.3275911
  const t = 1 / (1 + p * x)
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)

  return sign * y
}

// Attempt inverse error function via Newton's method
function internalErfInv(x: number): number {
  const z = Math.sqrt(-Math.log((1 - x) / 2))
  const a = 0.147
  let y = ((2 / (Math.PI * a) + Math.log(1 - x * x) / 2) ** 2 - Math.log(1 - x * x) / a) ** 0.5 - (2 / (Math.PI * a) + Math.log(1 - x * x) / 2)

  if (x > 0)
    y = Math.abs(y)
  else
    y = -Math.abs(y)

  // Refine with Newton iterations
  for (let i = 0; i < 3; i++) {
    const err = internalErf(y) - x
    y -= err / (2 / Math.sqrt(Math.PI) * Math.exp(-y * y))
  }

  return y
}

// Derive point of diminishing returns from p10
function derivePodrFromP10(median: number, p10: number): number {
  // podr is the value at which the log-normal CDF equals 0.9 (i.e., 10th percentile from top)
  // For log-normal: ln(podr) = mu + sigma * z_0.9
  // We know: ln(p10) = mu + sigma * z_0.9 and ln(median) = mu
  // So: sigma = (ln(median) - ln(p10)) / (z_0.9 - z_0.5)
  // z_0.9 ≈ 1.282, z_0.5 = 0
  return p10
}

// Calculate score (0-1) from metric value using log-normal distribution
export function quantileAtValue(curve: MetricCurve, value: number): number {
  const { median, p10 } = curve

  // Handle edge cases
  if (value <= 0)
    return 1
  if (median <= 0 || p10 <= 0)
    return 1

  // Log-normal parameters
  const mu = Math.log(median)

  // sigma derived from p10 being at 90th percentile (score of 0.9)
  // erf_inv(0.8) ≈ 0.906
  // But Lighthouse uses a simpler approximation
  const sigma = Math.abs(Math.log(median) - Math.log(p10)) / 0.9061938024368232

  // Calculate the score as the log-normal survival function
  const x = Math.log(value)
  const z = (x - mu) / (sigma * Math.SQRT2)
  const cdf = 0.5 * (1 + internalErf(z))

  // Score is 1 - CDF (survival function)
  return Math.max(0, Math.min(1, 1 - cdf))
}

// Calculate metric value from score (0-1)
export function valueAtQuantile(curve: MetricCurve, quantile: number): number {
  const { median, p10 } = curve

  // Handle edge cases
  if (quantile <= 0)
    return Number.POSITIVE_INFINITY
  if (quantile >= 1)
    return 0

  // Log-normal parameters
  const mu = Math.log(median)
  const sigma = Math.abs(Math.log(median) - Math.log(p10)) / 0.9061938024368232

  // Inverse survival function
  const z = internalErfInv(1 - 2 * quantile) * Math.SQRT2
  const x = z * sigma + mu

  return Math.exp(x)
}

// Calculate rating from score
export function calculateRating(score: number): Rating {
  if (score >= 0.9)
    return 'pass'
  if (score >= 0.5)
    return 'average'
  return 'fail'
}

// Get rating color
export function getRatingColor(rating: Rating): string {
  switch (rating) {
    case 'pass': return '#22c55e'
    case 'average': return '#f97316'
    case 'fail': return '#ef4444'
  }
}

// Get score color (gradient between rating colors)
export function getScoreColor(score: number): string {
  if (score >= 0.9)
    return '#22c55e' // green
  if (score >= 0.5) {
    // Interpolate between orange and green
    const t = (score - 0.5) / 0.4
    return score >= 0.7 ? '#84cc16' : '#f97316' // lime or orange
  }
  return '#ef4444' // red
}

// Get metrics for device
export function getMetricsForDevice(device: Device): MetricDefinition[] {
  const metrics = device === 'mobile' ? MOBILE_METRICS : DESKTOP_METRICS
  return Object.values(metrics).map(m => ({
    ...m,
    color: METRIC_COLORS[m.id],
    isCWV: CWV_METRICS.includes(m.id),
    description: METRIC_DESCRIPTIONS[m.id],
  }))
}

// Calculate overall score from metric values
export function calculateOverallScore(
  values: Record<MetricId, number>,
  device: Device,
): { score: number, metricScores: Record<MetricId, number> } {
  const metrics = getMetricsForDevice(device)
  const metricScores: Record<MetricId, number> = {} as Record<MetricId, number>

  let weightedSum = 0
  let totalWeight = 0

  for (const metric of metrics) {
    const value = values[metric.id]
    const score = quantileAtValue(metric.curve, value)
    metricScores[metric.id] = score
    weightedSum += score * metric.weight
    totalWeight += metric.weight
  }

  return {
    score: totalWeight > 0 ? weightedSum / totalWeight : 0,
    metricScores,
  }
}

// Format metric value for display
export function formatMetricValue(value: number, unit: 'ms' | 'unitless'): string {
  if (unit === 'ms') {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}s`
    }
    return `${Math.round(value)}ms`
  }
  return value.toFixed(2)
}

// Parse URL hash to get metric values
export function parseHashState(hash: string): { device: Device, values: Partial<Record<MetricId, number>> } | null {
  if (!hash || hash === '#')
    return null

  const params = new URLSearchParams(hash.slice(1))
  const device = (params.get('device') as Device) || 'mobile'
  const values: Partial<Record<MetricId, number>> = {}

  for (const id of ['FCP', 'SI', 'LCP', 'TBT', 'CLS'] as MetricId[]) {
    const val = params.get(id)
    if (val) {
      values[id] = Number.parseFloat(val)
    }
  }

  return { device, values }
}

// Generate URL hash from state
export function generateHashState(device: Device, values: Record<MetricId, number>): string {
  const params = new URLSearchParams()
  params.set('device', device)
  for (const [id, val] of Object.entries(values)) {
    params.set(id, val.toString())
  }
  return `#${params.toString()}`
}

// Get default values (p10 values = score of ~0.9)
export function getDefaultValues(device: Device): Record<MetricId, number> {
  const metrics = getMetricsForDevice(device)
  return Object.fromEntries(metrics.map(m => [m.id, m.curve.p10])) as Record<MetricId, number>
}

// Composable for reactive calculator state
export function useLighthouseCalculator() {
  const device = ref<Device>('mobile')
  const values = ref<Record<MetricId, number>>(getDefaultValues('mobile'))

  const metrics = computed(() => getMetricsForDevice(device.value))

  const result = computed(() => calculateOverallScore(values.value, device.value))

  const overallScore = computed(() => result.value.score)
  const metricScores = computed(() => result.value.metricScores)
  const overallRating = computed(() => calculateRating(overallScore.value))

  // Update values when device changes
  watch(device, (newDevice) => {
    values.value = getDefaultValues(newDevice)
  })

  function setMetricValue(id: MetricId, value: number) {
    values.value = { ...values.value, [id]: value }
  }

  function setMetricScore(id: MetricId, score: number) {
    const metric = metrics.value.find(m => m.id === id)
    if (metric) {
      const value = valueAtQuantile(metric.curve, score)
      setMetricValue(id, value)
    }
  }

  function reset() {
    values.value = getDefaultValues(device.value)
  }

  // URL state sync
  function syncFromHash() {
    if (!import.meta.client)
      return
    const state = parseHashState(window.location.hash)
    if (state) {
      device.value = state.device
      const defaults = getDefaultValues(state.device)
      values.value = { ...defaults, ...state.values }
    }
  }

  function syncToHash() {
    if (!import.meta.client)
      return
    const hash = generateHashState(device.value, values.value)
    window.history.replaceState(null, '', hash)
  }

  return {
    device,
    values,
    metrics,
    overallScore,
    metricScores,
    overallRating,
    setMetricValue,
    setMetricScore,
    reset,
    syncFromHash,
    syncToHash,
  }
}
