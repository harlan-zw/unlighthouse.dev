import type { FieldData, WebVitalMetric } from '../../utils/web-vitals'
import { formatMetricValue, getRating, parseFieldData } from '../../utils/web-vitals'

interface MetricResult {
  value: number
  displayValue: string
  rating: 'good' | 'needs-improvement' | 'poor'
  score: number
}

interface Recommendation {
  metric: string
  title: string
  description: string
  learnMoreUrl: string
  toolUrl?: string
}

function generateRecommendations(lab: Record<string, MetricResult>, field: FieldData | null): Recommendation[] {
  const recs: Recommendation[] = []

  // LCP
  if (lab.lcp?.rating !== 'good' || field?.lcp?.rating !== 'good') {
    recs.push({
      metric: 'lcp',
      title: 'Improve Largest Contentful Paint',
      description: `Your LCP is ${lab.lcp?.displayValue || 'unknown'}. Optimize your largest visible element by using optimized images, removing render-blocking resources, and preloading critical assets.`,
      learnMoreUrl: '/learn-lighthouse/lcp',
      toolUrl: '/tools/lcp-finder',
    })
  }

  // CLS
  if (lab.cls?.rating !== 'good' || field?.cls?.rating !== 'good') {
    recs.push({
      metric: 'cls',
      title: 'Reduce Cumulative Layout Shift',
      description: `Your CLS is ${lab.cls?.displayValue || 'unknown'}. Set explicit dimensions for images and embeds, reserve space for dynamic content, and avoid inserting content above existing content.`,
      learnMoreUrl: '/learn-lighthouse/cls',
      toolUrl: '/tools/cls-debugger',
    })
  }

  // INP (field only)
  if (field?.inp?.rating && field.inp.rating !== 'good') {
    recs.push({
      metric: 'inp',
      title: 'Improve Interaction to Next Paint',
      description: `Your INP is ${field.inp.displayValue}. Break up long JavaScript tasks, optimize event handlers, and reduce main thread blocking.`,
      learnMoreUrl: '/learn-lighthouse/inp',
      toolUrl: '/tools/inp-analyzer',
    })
  }

  // TBT (as proxy for INP in lab)
  if (lab.tbt?.rating !== 'good') {
    recs.push({
      metric: 'tbt',
      title: 'Reduce Total Blocking Time',
      description: `Your TBT is ${lab.tbt?.displayValue || 'unknown'}. This correlates with poor interactivity. Minimize main thread work by deferring non-critical JavaScript.`,
      learnMoreUrl: '/glossary/tbt',
    })
  }

  // FCP
  if (lab.fcp?.rating !== 'good') {
    recs.push({
      metric: 'fcp',
      title: 'Improve First Contentful Paint',
      description: `Your FCP is ${lab.fcp?.displayValue || 'unknown'}. Eliminate render-blocking resources and ensure critical CSS is inlined.`,
      learnMoreUrl: '/glossary/fcp',
    })
  }

  return recs
}

export default defineCachedEventHandler(async (event) => {
  await checkFreeToolRateLimit(event)
  const query = getQuery(event)
  const url = await validateUrl(query.url as string)
  const strategy = (query.strategy === 'desktop' ? 'desktop' : 'mobile') as 'mobile' | 'desktop'

  const results = await trackToolRequest(event, { tool: 'cwv-check', url, strategy }, async () => {
    const result = await fetchPSI(event, url, strategy)
    if (!result)
      throw createError({ statusCode: 500, message: 'Failed to fetch Lighthouse results' })
    return result
  })
  const audits = results.lighthouseResult.audits

  // Parse lab data
  const labMetrics: Record<string, MetricResult> = {}
  const metricMap = {
    lcp: 'largest-contentful-paint',
    cls: 'cumulative-layout-shift',
    fcp: 'first-contentful-paint',
    tbt: 'total-blocking-time',
    si: 'speed-index',
    ttfb: 'server-response-time',
  }

  for (const [key, auditId] of Object.entries(metricMap)) {
    const audit = audits[auditId]
    if (audit) {
      const value = audit.numericValue || 0
      labMetrics[key] = {
        value,
        displayValue: audit.displayValue || formatMetricValue(value, key),
        rating: getRating(value, key as WebVitalMetric),
        score: Math.round((audit.score || 0) * 100),
      }
    }
  }

  // Parse field data from loadingExperience
  const loadingExperience = (results as unknown as { loadingExperience?: Record<string, unknown> }).loadingExperience
  const fieldData = parseFieldData(loadingExperience)

  // Generate recommendations
  const recommendations = generateRecommendations(labMetrics, fieldData)

  // Calculate overall CWV pass status
  const passesCWV = (() => {
    // Use field data if available (more accurate)
    if (fieldData?.lcp && fieldData?.cls && fieldData?.inp) {
      return fieldData.lcp.rating === 'good'
        && fieldData.cls.rating === 'good'
        && fieldData.inp.rating === 'good'
    }
    // Fall back to lab data
    return labMetrics.lcp?.rating === 'good'
      && labMetrics.cls?.rating === 'good'
      && labMetrics.tbt?.rating === 'good' // TBT as proxy for INP
  })()

  // Screenshot
  const screenshot = results.lighthouseResult.fullPageScreenshot?.screenshot

  // Filmstrip timeline
  const filmstripAudit = audits['screenshot-thumbnails']
  const filmstrip = (filmstripAudit?.details?.items || []).slice(0, 10).map((item: Record<string, unknown>) => ({
    timing: item.timing as number,
    data: item.data as string,
  }))

  return {
    url,
    fetchedUrl: results.lighthouseResult.finalDisplayedUrl || url,
    timestamp: Date.now(),
    strategy,
    passesCWV,
    performanceScore: Math.round((results.lighthouseResult.categories.performance?.score || 0) * 100),
    lab: {
      lcp: labMetrics.lcp || null,
      cls: labMetrics.cls || null,
      fcp: labMetrics.fcp || null,
      tbt: labMetrics.tbt || null,
      si: labMetrics.si || null,
      ttfb: labMetrics.ttfb || null,
    },
    field: fieldData,
    recommendations,
    filmstrip,
    screenshot: screenshot
      ? {
          data: screenshot.data,
          width: screenshot.width || 0,
          height: screenshot.height || 0,
        }
      : null,
  }
}, {
  base: 'psi',
  swr: true,
  getKey: (event) => {
    const q = getQuery(event)
    return `cwv:v1:${q.strategy || 'mobile'}:${q.url}`
  },
  maxAge: 60 * 60,
  staleMaxAge: 24 * 60 * 60,
})
