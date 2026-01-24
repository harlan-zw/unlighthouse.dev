import type { H3Event } from 'h3'

export type FormFactor = 'PHONE' | 'DESKTOP' | 'TABLET' | 'ALL_FORM_FACTORS'

interface CrUXHistoryResult {
  key: {
    formFactor: 'PHONE' | 'DESKTOP' | 'TABLET'
    origin?: string
    url?: string
  }
  metrics: {
    cumulative_layout_shift?: MetricTimeseries
    largest_contentful_paint?: MetricTimeseries
    interaction_to_next_paint?: MetricTimeseries
    first_input_delay?: MetricTimeseries
    first_contentful_paint?: MetricTimeseries
    experimental_time_to_first_byte?: MetricTimeseries
    round_trip_time?: MetricTimeseries
  }
  collectionPeriods: Array<{
    firstDate: { year: number, month: number, day: number }
    lastDate: { year: number, month: number, day: number }
  }>
}

interface MetricTimeseries {
  histogramTimeseries: Array<{
    start: number | string
    end?: number | string
    densities: (number | string)[]
  }>
  percentilesTimeseries: {
    p75s: (number | string | null)[]
  }
}

export interface NormalizedCrUXHistoryResult {
  date: string
  collectionStart: string
  collectionEnd: string
  cls75?: number
  lcp75?: number
  inp75?: number
  fcp75?: number
  ttfb75?: number
  rtt75?: number
  // Histogram distributions
  lcpGood?: number
  lcpNeedsImprovement?: number
  lcpPoor?: number
  clsGood?: number
  clsNeedsImprovement?: number
  clsPoor?: number
  fcpGood?: number
  fcpNeedsImprovement?: number
  fcpPoor?: number
  ttfbGood?: number
  ttfbNeedsImprovement?: number
  ttfbPoor?: number
  inpGood?: number
  inpNeedsImprovement?: number
  inpPoor?: number
}

export function normaliseCruxHistory(data: CrUXHistoryResult): NormalizedCrUXHistoryResult[] {
  const {
    cumulative_layout_shift,
    largest_contentful_paint,
    interaction_to_next_paint,
    first_contentful_paint,
    experimental_time_to_first_byte,
    round_trip_time,
  } = data.metrics

  const dates = data.collectionPeriods.map((period) => {
    const date = new Date(period.firstDate.year, period.firstDate.month - 1, period.firstDate.day)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  })

  const collectionPeriods = data.collectionPeriods.map((period) => {
    const startDate = new Date(period.firstDate.year, period.firstDate.month - 1, period.firstDate.day)
    const endDate = new Date(period.lastDate.year, period.lastDate.month - 1, period.lastDate.day)
    return {
      start: `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`,
      end: `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`,
    }
  })

  function normaliseP75(segment: number | string | null, i: number) {
    const value = typeof segment === 'string' ? Number.parseFloat(segment) : (segment || 0)
    return {
      value: Number.isNaN(value) ? 0 : value,
      date: dates[i],
    }
  }

  const cls = (cumulative_layout_shift?.percentilesTimeseries?.p75s || []).map(normaliseP75)
  const lcp = (largest_contentful_paint?.percentilesTimeseries?.p75s || []).map(normaliseP75)
  const inp = (interaction_to_next_paint?.percentilesTimeseries?.p75s || []).map(normaliseP75)
  const fcp = (first_contentful_paint?.percentilesTimeseries?.p75s || []).map(normaliseP75)
  const ttfb = (experimental_time_to_first_byte?.percentilesTimeseries?.p75s || []).map(normaliseP75)
  const rtt = (round_trip_time?.percentilesTimeseries?.p75s || []).map(normaliseP75)

  function extractHistogram(histogramTimeseries: MetricTimeseries['histogramTimeseries'] | undefined) {
    if (!histogramTimeseries?.length)
      return { good: [], needsImprovement: [], poor: [] }

    const good = histogramTimeseries[0]?.densities || []
    const needsImprovement = histogramTimeseries[1]?.densities || []
    const poor = histogramTimeseries[2]?.densities || []

    const clean = (v: number | string) => v === 'NaN' || Number.isNaN(v) ? undefined : Number(v)

    return {
      good: good.map(clean),
      needsImprovement: needsImprovement.map(clean),
      poor: poor.map(clean),
    }
  }

  const lcpHistogram = extractHistogram(largest_contentful_paint?.histogramTimeseries)
  const clsHistogram = extractHistogram(cumulative_layout_shift?.histogramTimeseries)
  const fcpHistogram = extractHistogram(first_contentful_paint?.histogramTimeseries)
  const ttfbHistogram = extractHistogram(experimental_time_to_first_byte?.histogramTimeseries)
  const inpHistogram = extractHistogram(interaction_to_next_paint?.histogramTimeseries)

  // Find valid data range
  const clsStart = cls.findIndex(v => v.value >= 0)
  const lcpStart = lcp.findIndex(v => v.value > 0)
  const inpStart = inp.findIndex(v => v.value > 0)
  const fcpStart = fcp.findIndex(v => v.value > 0)
  const ttfbStart = ttfb.findIndex(v => v.value > 0)
  const indexes = [clsStart, lcpStart, inpStart, fcpStart, ttfbStart].filter(i => i > -1)

  if (!indexes.length)
    return []

  const start = Math.min(...indexes)
  const end = Math.max(
    cls.findLastIndex(v => v.value >= 0),
    lcp.findLastIndex(v => v.value > 0),
    inp.findLastIndex(v => v.value > 0),
    fcp.findLastIndex(v => v.value > 0),
    ttfb.findLastIndex(v => v.value > 0),
  )

  return dates.slice(start, end + 1).map((date, idx) => {
    const actualIdx = start + idx
    return {
      date,
      collectionStart: collectionPeriods[actualIdx].start,
      collectionEnd: collectionPeriods[actualIdx].end,
      cls75: cls.find(v => v.date === date)?.value,
      lcp75: lcp.find(v => v.date === date)?.value,
      inp75: inp.find(v => v.date === date)?.value,
      fcp75: fcp.find(v => v.date === date)?.value,
      ttfb75: ttfb.find(v => v.date === date)?.value,
      rtt75: rtt.find(v => v.date === date)?.value,
      lcpGood: lcpHistogram.good[actualIdx],
      lcpNeedsImprovement: lcpHistogram.needsImprovement[actualIdx],
      lcpPoor: lcpHistogram.poor[actualIdx],
      clsGood: clsHistogram.good[actualIdx],
      clsNeedsImprovement: clsHistogram.needsImprovement[actualIdx],
      clsPoor: clsHistogram.poor[actualIdx],
      fcpGood: fcpHistogram.good[actualIdx],
      fcpNeedsImprovement: fcpHistogram.needsImprovement[actualIdx],
      fcpPoor: fcpHistogram.poor[actualIdx],
      ttfbGood: ttfbHistogram.good[actualIdx],
      ttfbNeedsImprovement: ttfbHistogram.needsImprovement[actualIdx],
      ttfbPoor: ttfbHistogram.poor[actualIdx],
      inpGood: inpHistogram.good[actualIdx],
      inpNeedsImprovement: inpHistogram.needsImprovement[actualIdx],
      inpPoor: inpHistogram.poor[actualIdx],
    }
  })
}

export async function fetchCrUXHistory(event: H3Event, url: string, mode: 'origin' | 'url', formFactor: FormFactor) {
  const apiKey = useRuntimeConfig(event).googleApiToken
  if (!apiKey)
    throw createError({ statusCode: 500, message: 'Google API key not configured' })

  const endpoint = `https://chromeuxreport.googleapis.com/v1/records:queryHistoryRecord?key=${apiKey}`

  const payload: Record<string, unknown> = {}
  if (formFactor !== 'ALL_FORM_FACTORS')
    payload.formFactor = formFactor

  if (mode === 'origin') {
    // Normalize to origin only (strip path)
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`)
    payload.origin = `${parsed.protocol}//${parsed.host}`
  }
  else {
    payload.url = url
  }

  return $fetch<{ record: CrUXHistoryResult }>(endpoint, {
    method: 'POST',
    body: payload,
  }).catch((e) => {
    if (e?.status === 404 || e?.statusCode === 404)
      return null
    throw e
  })
}

// Current CrUX data types
interface CrUXCurrentResult {
  key: {
    formFactor: 'PHONE' | 'DESKTOP' | 'TABLET'
    origin?: string
    url?: string
  }
  metrics: {
    cumulative_layout_shift?: CrUXMetric
    largest_contentful_paint?: CrUXMetric
    interaction_to_next_paint?: CrUXMetric
    first_contentful_paint?: CrUXMetric
    experimental_time_to_first_byte?: CrUXMetric
    round_trip_time?: CrUXMetric
  }
  collectionPeriod: {
    firstDate: { year: number, month: number, day: number }
    lastDate: { year: number, month: number, day: number }
  }
}

interface CrUXMetric {
  histogram: Array<{
    start: number | string
    end?: number | string
    density: number | string
  }>
  percentiles: {
    p75: number | string
  }
}

export interface NormalizedCrUXCurrentResult {
  collectionStart: string
  collectionEnd: string
  lcp?: { p75: number, good: number, needsImprovement: number, poor: number }
  cls?: { p75: number, good: number, needsImprovement: number, poor: number }
  inp?: { p75: number, good: number, needsImprovement: number, poor: number }
  fcp?: { p75: number, good: number, needsImprovement: number, poor: number }
  ttfb?: { p75: number, good: number, needsImprovement: number, poor: number }
}

function normalizeMetric(metric: CrUXMetric | undefined): { p75: number, good: number, needsImprovement: number, poor: number } | undefined {
  if (!metric)
    return undefined
  const p75 = typeof metric.percentiles.p75 === 'string' ? Number.parseFloat(metric.percentiles.p75) : metric.percentiles.p75
  const histogram = metric.histogram || []
  const good = typeof histogram[0]?.density === 'string' ? Number.parseFloat(histogram[0].density) : (histogram[0]?.density || 0)
  const needsImprovement = typeof histogram[1]?.density === 'string' ? Number.parseFloat(histogram[1].density) : (histogram[1]?.density || 0)
  const poor = typeof histogram[2]?.density === 'string' ? Number.parseFloat(histogram[2].density) : (histogram[2]?.density || 0)
  return { p75, good, needsImprovement, poor }
}

export function normalizeCruxCurrent(data: CrUXCurrentResult): NormalizedCrUXCurrentResult {
  const { metrics, collectionPeriod } = data
  const startDate = new Date(collectionPeriod.firstDate.year, collectionPeriod.firstDate.month - 1, collectionPeriod.firstDate.day)
  const endDate = new Date(collectionPeriod.lastDate.year, collectionPeriod.lastDate.month - 1, collectionPeriod.lastDate.day)
  return {
    collectionStart: `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`,
    collectionEnd: `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`,
    lcp: normalizeMetric(metrics.largest_contentful_paint),
    cls: normalizeMetric(metrics.cumulative_layout_shift),
    inp: normalizeMetric(metrics.interaction_to_next_paint),
    fcp: normalizeMetric(metrics.first_contentful_paint),
    ttfb: normalizeMetric(metrics.experimental_time_to_first_byte),
  }
}

export async function fetchCrUXCurrent(event: H3Event, url: string, mode: 'origin' | 'url', formFactor: FormFactor) {
  const apiKey = useRuntimeConfig(event).googleApiToken
  if (!apiKey)
    throw createError({ statusCode: 500, message: 'Google API key not configured' })

  const endpoint = `https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=${apiKey}`

  const payload: Record<string, unknown> = {}
  if (formFactor !== 'ALL_FORM_FACTORS')
    payload.formFactor = formFactor

  if (mode === 'origin') {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`)
    payload.origin = `${parsed.protocol}//${parsed.host}`
  }
  else {
    payload.url = url
  }

  return $fetch<{ record: CrUXCurrentResult }>(endpoint, {
    method: 'POST',
    body: payload,
  }).catch((e) => {
    if (e?.status === 404 || e?.statusCode === 404)
      return null
    throw e
  })
}
