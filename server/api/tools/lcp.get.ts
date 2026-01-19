import { trackToolLookup, trackToolUsage } from '../../utils/analytics'
import { detectFramework, extractOpportunities, extractScreenshot, fetchPSI } from '../../utils/psi'
import { checkFreeToolRateLimit } from '../../utils/rate-limit'

interface BreakdownPhase {
  subpart: string
  label: string
  duration: number
}

interface DiscoveryCheck {
  value: boolean
  label: string
}

export default defineCachedEventHandler(async (event) => {
  await checkFreeToolRateLimit(event)
  const query = getQuery(event)
  const url = await validateUrl(query.url as string)
  const strategy = (query.strategy === 'desktop' ? 'desktop' : 'mobile') as 'mobile' | 'desktop'

  await trackToolUsage(event, 'lcp', 'use')
  await trackToolLookup(event, 'lcp', url, strategy)

  const results = await fetchPSI(event, url, strategy)

  const audits = results.lighthouseResult.audits
  const lcpAudit = audits['largest-contentful-paint']
  const lcpBreakdown = audits['lcp-breakdown-insight']
  const lcpDiscovery = audits['lcp-discovery-insight']

  // Extract LCP breakdown timing phases
  // PSI returns phases in lcp-breakdown-insight.details.items as a table
  const breakdownItems = lcpBreakdown?.details?.items || []
  const timingTable = breakdownItems.find((item: Record<string, unknown>) => item.type === 'table') as {
    items?: BreakdownPhase[]
  } | undefined

  let phases = (timingTable?.items || []).map((phase: BreakdownPhase) => ({
    id: phase.subpart,
    label: phase.label,
    duration: Math.round(phase.duration),
  }))

  // Validate phases sum roughly matches LCP value - if not, phases data may be stale/wrong
  const phasesSum = phases.reduce((sum, p) => sum + p.duration, 0)
  const lcpValue = lcpAudit?.numericValue || 0
  if (phasesSum > 0 && Math.abs(phasesSum - lcpValue) > lcpValue * 0.2) {
    // Phases don't add up - clear them to avoid showing misleading data
    console.warn(`LCP phases sum (${phasesSum}ms) doesn't match LCP value (${lcpValue}ms) for ${url}`)
    phases = []
  }

  // Extract LCP element
  const elementNode = breakdownItems.find((item: Record<string, unknown>) => item.type === 'node') as {
    snippet?: string
    nodeLabel?: string
    selector?: string
    boundingRect?: { top: number, left: number, right: number, bottom: number, width: number, height: number }
  } | undefined

  const extractElementInfo = () => {
    if (!elementNode)
      return null

    const snippet = elementNode.snippet || ''
    const nodeLabel = elementNode.nodeLabel || ''

    const tagMatch = snippet.match(/^<(\w+)/)
    const tagName = tagMatch?.[1] || 'unknown'

    const type = tagName === 'img'
      ? 'image'
      : tagName === 'video'
        ? 'video'
        : tagName === 'svg'
          ? 'svg'
          : 'text'

    return {
      tagName,
      snippet: nodeLabel || snippet,
      selector: elementNode.selector || '',
      boundingRect: elementNode.boundingRect,
      type,
    }
  }

  // Extract LCP discovery checklist (for images)
  const discoveryItems = lcpDiscovery?.details?.items || []
  const checklist = discoveryItems.find((item: Record<string, unknown>) => item.type === 'checklist') as {
    items?: Record<string, DiscoveryCheck>
  } | undefined

  const discovery = checklist?.items
    ? {
        eagerlyLoaded: checklist.items.eagerlyLoaded?.value ?? null,
        requestDiscoverable: checklist.items.requestDiscoverable?.value ?? null,
        priorityHinted: checklist.items.priorityHinted?.value ?? null,
      }
    : null

  const lcpOpportunityIds = [
    'render-blocking-resources',
    'unused-css-rules',
    'unused-javascript',
    'offscreen-images',
    'unminified-css',
    'unminified-javascript',
    'uses-optimized-images',
    'uses-webp-images',
    'uses-responsive-images',
    'efficient-animated-content',
    'server-response-time',
    'prioritize-lcp-image',
  ]

  return {
    url,
    fetchedUrl: results.lighthouseResult.finalDisplayedUrl || url,
    timestamp: Date.now(),
    framework: detectFramework(audits),
    lcp: {
      value: lcpAudit?.numericValue || 0,
      displayValue: lcpAudit?.displayValue || '',
      score: (lcpAudit?.score || 0) * 100,
    },
    phases,
    element: extractElementInfo(),
    discovery,
    opportunities: extractOpportunities(audits, lcpOpportunityIds),
    screenshot: extractScreenshot(results),
    strategy,
    performanceScore: (results.lighthouseResult.categories.performance?.score || 0) * 100,
  }
}, {
  base: 'psi',
  swr: true,
  getKey: (event) => {
    const q = getQuery(event)
    return `lcp:v3:${q.strategy || 'mobile'}:${q.url}`
  },
  maxAge: 60 * 60,
  staleMaxAge: 24 * 60 * 60,
})
