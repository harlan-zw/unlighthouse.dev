import { detectFramework, extractScreenshot, fetchPSI } from '../../utils/psi'

export default defineCachedEventHandler(async (event) => {
  const query = getQuery(event)
  const url = await validateUrl(query.url as string)
  const strategy = (query.strategy === 'desktop' ? 'desktop' : 'mobile') as 'mobile' | 'desktop'

  const results = await fetchPSI(event, url, strategy)
  const audits = results.lighthouseResult.audits

  // Core Web Vitals metrics
  const metrics = [
    {
      id: 'fcp',
      title: 'First Contentful Paint',
      shortTitle: 'FCP',
      displayValue: audits['first-contentful-paint']?.displayValue || '',
      numericValue: audits['first-contentful-paint']?.numericValue || 0,
      score: Math.round((audits['first-contentful-paint']?.score || 0) * 100),
      thresholds: { good: 1800, poor: 3000 },
    },
    {
      id: 'lcp',
      title: 'Largest Contentful Paint',
      shortTitle: 'LCP',
      displayValue: audits['largest-contentful-paint']?.displayValue || '',
      numericValue: audits['largest-contentful-paint']?.numericValue || 0,
      score: Math.round((audits['largest-contentful-paint']?.score || 0) * 100),
      thresholds: { good: 2500, poor: 4000 },
    },
    {
      id: 'tbt',
      title: 'Total Blocking Time',
      shortTitle: 'TBT',
      displayValue: audits['total-blocking-time']?.displayValue || '',
      numericValue: audits['total-blocking-time']?.numericValue || 0,
      score: Math.round((audits['total-blocking-time']?.score || 0) * 100),
      thresholds: { good: 200, poor: 600 },
    },
    {
      id: 'cls',
      title: 'Cumulative Layout Shift',
      shortTitle: 'CLS',
      displayValue: audits['cumulative-layout-shift']?.displayValue || '',
      numericValue: audits['cumulative-layout-shift']?.numericValue || 0,
      score: Math.round((audits['cumulative-layout-shift']?.score || 0) * 100),
      thresholds: { good: 0.1, poor: 0.25 },
    },
    {
      id: 'si',
      title: 'Speed Index',
      shortTitle: 'SI',
      displayValue: audits['speed-index']?.displayValue || '',
      numericValue: audits['speed-index']?.numericValue || 0,
      score: Math.round((audits['speed-index']?.score || 0) * 100),
      thresholds: { good: 3400, poor: 5800 },
    },
    {
      id: 'tti',
      title: 'Time to Interactive',
      shortTitle: 'TTI',
      displayValue: audits.interactive?.displayValue || '',
      numericValue: audits.interactive?.numericValue || 0,
      score: Math.round((audits.interactive?.score || 0) * 100),
      thresholds: { good: 3800, poor: 7300 },
    },
  ]

  // LCP breakdown and element
  const lcpBreakdown = audits['lcp-breakdown-insight']
  const breakdownItems = lcpBreakdown?.details?.items || []
  const timingTable = breakdownItems.find((item: Record<string, unknown>) => item.type === 'table') as {
    items?: Array<{ subpart: string, label: string, duration: number }>
  } | undefined
  const elementNode = breakdownItems.find((item: Record<string, unknown>) => item.type === 'node') as {
    snippet?: string
    nodeLabel?: string
    selector?: string
    boundingRect?: { top: number, left: number, right: number, bottom: number, width: number, height: number }
  } | undefined

  const lcpPhases = (timingTable?.items || []).map(phase => ({
    id: phase.subpart,
    label: phase.label,
    duration: Math.round(phase.duration),
  }))

  const lcpElement = elementNode
    ? {
        tagName: elementNode.snippet?.match(/^<(\w+)/)?.[1] || 'unknown',
        snippet: elementNode.nodeLabel || elementNode.snippet || '',
        selector: elementNode.selector || '',
        boundingRect: elementNode.boundingRect,
        type: elementNode.snippet?.startsWith('<img') ? 'image' : elementNode.snippet?.startsWith('<video') ? 'video' : 'text',
      }
    : null

  // LCP discovery checklist
  const lcpDiscovery = audits['lcp-discovery-insight']
  const discoveryItems = lcpDiscovery?.details?.items || []
  const checklist = discoveryItems.find((item: Record<string, unknown>) => item.type === 'checklist') as {
    items?: Record<string, { value: boolean, label: string }>
  } | undefined
  const discovery = checklist?.items
    ? {
        eagerlyLoaded: checklist.items.eagerlyLoaded?.value ?? null,
        requestDiscoverable: checklist.items.requestDiscoverable?.value ?? null,
        priorityHinted: checklist.items.priorityHinted?.value ?? null,
      }
    : null

  // Resource summary
  const resourceSummary = audits['resource-summary']
  const resources = (resourceSummary?.details?.items || []).map((item: Record<string, unknown>) => ({
    type: item.resourceType as string,
    label: item.label as string,
    count: item.requestCount as number,
    size: item.transferSize as number,
  }))

  // Third parties
  const thirdParties = audits['third-parties-insight']
  const thirdPartyItems = (thirdParties?.details?.items || []).map((item: Record<string, unknown>) => ({
    entity: item.entity as string,
    size: item.transferSize as number,
    mainThreadTime: item.mainThreadTime as number,
    subItems: ((item.subItems as Record<string, unknown>)?.items as Array<{ url: string, transferSize: number, mainThreadTime: number }>) || [],
  }))

  // Main thread work breakdown
  const mainThreadWork = audits['mainthread-work-breakdown']
  const mainThreadItems = (mainThreadWork?.details?.items || []).map((item: Record<string, unknown>) => ({
    group: item.group as string,
    label: item.groupLabel as string,
    duration: item.duration as number,
  }))
  const mainThreadTotal = mainThreadWork?.numericValue || 0

  // Opportunities with savings
  const opportunityIds = [
    'render-blocking-insight',
    'unused-css-rules',
    'unused-javascript',
    'uses-optimized-images',
    'uses-webp-images',
    'uses-responsive-images',
    'server-response-time',
    'unminified-css',
    'unminified-javascript',
  ]
  const opportunities = opportunityIds
    .map((id) => {
      const audit = audits[id]
      if (!audit || audit.score === 1 || audit.score === null)
        return null
      return {
        id,
        title: audit.title,
        description: audit.description,
        displayValue: audit.displayValue || '',
        score: audit.score,
        savings: audit.metricSavings || audit.details?.overallSavingsMs
          ? {
              lcp: (audit.metricSavings as Record<string, number>)?.LCP || 0,
              fcp: (audit.metricSavings as Record<string, number>)?.FCP || 0,
              tbt: (audit.metricSavings as Record<string, number>)?.TBT || 0,
              bytes: audit.details?.overallSavingsBytes || 0,
            }
          : null,
      }
    })
    .filter(Boolean)

  // Diagnostics summary
  const diagnostics = audits.diagnostics?.details?.items?.[0] as Record<string, number> | undefined
  const diagnosticsSummary = diagnostics
    ? {
        totalRequests: diagnostics.numRequests || 0,
        totalSize: diagnostics.totalByteWeight || 0,
        numScripts: diagnostics.numScripts || 0,
        numStylesheets: diagnostics.numStylesheets || 0,
        numFonts: diagnostics.numFonts || 0,
        numTasksOver50ms: diagnostics.numTasksOver50ms || 0,
        numTasksOver100ms: diagnostics.numTasksOver100ms || 0,
        mainDocumentSize: diagnostics.mainDocumentTransferSize || 0,
        maxRtt: diagnostics.maxRtt || 0,
      }
    : null

  // Screenshot timeline (filmstrip)
  const filmstrip = audits['screenshot-thumbnails']
  const filmstripItems = (filmstrip?.details?.items || []).slice(0, 10).map((item: Record<string, unknown>) => ({
    timing: item.timing as number,
    data: item.data as string,
  }))

  return {
    url,
    fetchedUrl: results.lighthouseResult.finalDisplayedUrl || url,
    timestamp: Date.now(),
    strategy,
    framework: detectFramework(audits),
    performanceScore: Math.round((results.lighthouseResult.categories.performance?.score || 0) * 100),
    metrics,
    lcp: {
      value: audits['largest-contentful-paint']?.numericValue || 0,
      displayValue: audits['largest-contentful-paint']?.displayValue || '',
      score: Math.round((audits['largest-contentful-paint']?.score || 0) * 100),
      phases: lcpPhases,
      element: lcpElement,
      discovery,
    },
    resources,
    thirdParties: thirdPartyItems,
    mainThread: {
      total: mainThreadTotal,
      items: mainThreadItems,
    },
    opportunities,
    diagnostics: diagnosticsSummary,
    filmstrip: filmstripItems,
    screenshot: extractScreenshot(results),
  }
}, {
  base: 'psi',
  swr: true,
  getKey: (event) => {
    const q = getQuery(event)
    return `psi:v2:${q.strategy || 'mobile'}:${q.url}`
  },
  maxAge: 60 * 60,
  staleMaxAge: 24 * 60 * 60,
})
