import type { H3Event } from 'h3'
import type { PSIResult } from '../../utils/psi'
import { trackToolUsage } from '../../utils/analytics'
import { fetchPSI } from '../../utils/psi'
import { checkFreeToolRateLimit } from '../../utils/rate-limit'
import { normalizeUrl } from '../../utils/url'

interface BulkPSIResult {
  url: string
  status: 'queued' | 'processing' | 'success' | 'error'
  performance: number | null
  lcp: MetricResult | null
  cls: MetricResult | null
  fcp: MetricResult | null
  tbt: MetricResult | null
  si: MetricResult | null
  error?: string
}

interface MetricResult {
  value: number
  displayValue: string
  rating: 'good' | 'needs-improvement' | 'poor'
}

const MAX_URLS = 10
const CONCURRENCY = 3

function getMetricRating(score: number): 'good' | 'needs-improvement' | 'poor' {
  if (score >= 0.9)
    return 'good'
  if (score >= 0.5)
    return 'needs-improvement'
  return 'poor'
}

function extractMetric(audits: PSIResult['lighthouseResult']['audits'], id: string): MetricResult | null {
  const audit = audits[id]
  if (!audit || audit.score === null)
    return null

  return {
    value: audit.numericValue || 0,
    displayValue: audit.displayValue || '',
    rating: getMetricRating(audit.score),
  }
}

async function processSingleUrl(
  event: H3Event,
  url: string,
  strategy: 'mobile' | 'desktop',
): Promise<BulkPSIResult> {
  const result = await fetchPSI(event, url, strategy)
  const audits = result.lighthouseResult.audits
  const performanceScore = result.lighthouseResult.categories.performance?.score

  return {
    url,
    status: 'success',
    performance: performanceScore !== undefined ? Math.round(performanceScore * 100) : null,
    lcp: extractMetric(audits, 'largest-contentful-paint'),
    cls: extractMetric(audits, 'cumulative-layout-shift'),
    fcp: extractMetric(audits, 'first-contentful-paint'),
    tbt: extractMetric(audits, 'total-blocking-time'),
    si: extractMetric(audits, 'speed-index'),
  }
}

export default defineEventHandler(async (event) => {
  await checkFreeToolRateLimit(event)

  const body = await readBody<{
    urls: string[]
    device?: 'mobile' | 'desktop'
  }>(event)

  if (!body?.urls || !Array.isArray(body.urls)) {
    throw createError({ statusCode: 400, message: 'URLs array is required' })
  }

  // Normalize and dedupe URLs
  const urls = [...new Set(
    body.urls
      .map(u => typeof u === 'string' ? u.trim() : '')
      .filter(u => u.length > 0)
      .slice(0, MAX_URLS)
      .map(normalizeUrl),
  )]

  if (urls.length === 0) {
    throw createError({ statusCode: 400, message: 'At least one valid URL is required' })
  }

  const strategy = body.device === 'desktop' ? 'desktop' : 'mobile'

  await trackToolUsage(event, 'bulk-pagespeed', 'use')

  // Set up SSE
  setResponseHeaders(event, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  })

  const sendEvent = (data: unknown) => {
    event.node.res.write(`data: ${JSON.stringify(data)}\n\n`)
  }

  // Initialize all URLs as queued
  const results: BulkPSIResult[] = urls.map(url => ({
    url,
    status: 'queued' as const,
    performance: null,
    lcp: null,
    cls: null,
    fcp: null,
    tbt: null,
    si: null,
  }))

  // Send initial state
  sendEvent({ type: 'init', results, device: strategy })

  // Process URLs with concurrency limit
  const queue = [...urls]
  const processing = new Set<string>()

  async function processNext(): Promise<void> {
    if (queue.length === 0)
      return

    const url = queue.shift()!
    processing.add(url)

    // Update status to processing
    const idx = urls.indexOf(url)
    results[idx]!.status = 'processing'
    sendEvent({ type: 'status', url, status: 'processing', index: idx })

    // Process the URL
    const result = await processSingleUrl(event, url, strategy).catch(err => ({
      url,
      status: 'error' as const,
      performance: null,
      lcp: null,
      cls: null,
      fcp: null,
      tbt: null,
      si: null,
      error: err?.message || 'Failed to analyze URL',
    }))

    results[idx] = result
    processing.delete(url)

    sendEvent({ type: 'result', index: idx, result })

    // Process next in queue
    await processNext()
  }

  // Start initial batch of concurrent requests
  const initialBatch = Math.min(CONCURRENCY, urls.length)
  await Promise.all(
    Array.from({ length: initialBatch }, () => processNext()),
  )

  // Calculate summary
  const successfulResults = results.filter(r => r.status === 'success' && r.performance !== null)
  const avgPerformance = successfulResults.length > 0
    ? Math.round(successfulResults.reduce((sum, r) => sum + (r.performance || 0), 0) / successfulResults.length)
    : 0

  const summary = {
    totalUrls: urls.length,
    successCount: successfulResults.length,
    errorCount: results.filter(r => r.status === 'error').length,
    avgPerformance,
    goodCount: successfulResults.filter(r => (r.performance || 0) >= 90).length,
    needsWorkCount: successfulResults.filter(r => (r.performance || 0) >= 50 && (r.performance || 0) < 90).length,
    poorCount: successfulResults.filter(r => (r.performance || 0) < 50).length,
  }

  sendEvent({ type: 'complete', results, summary, device: strategy, timestamp: Date.now() })

  event.node.res.end()
})
