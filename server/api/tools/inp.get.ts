import { trackToolLookup, trackToolUsage } from '../../utils/analytics'
import { detectFramework, extractOpportunities, extractScreenshot, fetchPSI } from '../../utils/psi'
import { checkFreeToolRateLimit } from '../../utils/rate-limit'

export default defineCachedEventHandler(async (event) => {
  await checkFreeToolRateLimit(event)
  const query = getQuery(event)
  const url = await validateUrl(query.url as string)
  const strategy = (query.strategy === 'desktop' ? 'desktop' : 'mobile') as 'mobile' | 'desktop'

  await trackToolUsage(event, 'inp', 'use')
  await trackToolLookup(event, 'inp', url, strategy)

  const results = await fetchPSI(event, url, strategy)
  const audits = results.lighthouseResult.audits

  // TBT is the lab proxy for INP (Total Blocking Time)
  const tbt = audits['total-blocking-time']
  const tbtValue = tbt?.numericValue || 0
  const tbtScore = Math.round((tbt?.score || 0) * 100)

  // Main thread work breakdown
  const mainThreadWork = audits['mainthread-work-breakdown']
  const mainThreadItems = (mainThreadWork?.details?.items || []).map((item: Record<string, unknown>) => ({
    group: item.group as string,
    label: item.groupLabel as string,
    duration: Math.round(item.duration as number),
  })).sort((a: { duration: number }, b: { duration: number }) => b.duration - a.duration)
  const mainThreadTotal = Math.round(mainThreadWork?.numericValue || 0)

  // Long tasks breakdown
  const longTasks = audits['long-tasks']
  const longTaskItems = (longTasks?.details?.items || []).slice(0, 10).map((item: Record<string, unknown>) => ({
    url: (item.url as string) || 'Unknown',
    startTime: Math.round(item.startTime as number),
    duration: Math.round(item.duration as number),
  }))

  // Third-party script impact on main thread
  const thirdParties = audits['third-party-summary']
  const thirdPartyItems = (thirdParties?.details?.items || [])
    .filter((item: Record<string, unknown>) => (item.blockingTime as number) > 0)
    .map((item: Record<string, unknown>) => ({
      entity: (item.entity as { text?: string })?.text || 'Unknown',
      blockingTime: Math.round(item.blockingTime as number),
      mainThreadTime: Math.round(item.mainThreadTime as number),
      transferSize: item.transferSize as number,
    }))
    .sort((a: { blockingTime: number }, b: { blockingTime: number }) => b.blockingTime - a.blockingTime)

  // Diagnostics for long tasks
  const diagnostics = audits.diagnostics?.details?.items?.[0] as Record<string, number> | undefined
  const taskMetrics = diagnostics
    ? {
        numTasksOver50ms: diagnostics.numTasksOver50ms || 0,
        numTasksOver100ms: diagnostics.numTasksOver100ms || 0,
        numTasksOver500ms: diagnostics.numTasksOver500ms || 0,
        maxServerLatency: Math.round(diagnostics.maxServerLatency || 0),
      }
    : null

  // Script evaluation breakdown
  const bootupTime = audits['bootup-time']
  const scriptItems = (bootupTime?.details?.items || []).slice(0, 8).map((item: Record<string, unknown>) => ({
    url: item.url as string,
    total: Math.round(item.total as number),
    scripting: Math.round(item.scripting as number),
    scriptParseCompile: Math.round(item.scriptParseCompile as number),
  }))

  // JS execution opportunities
  const opportunityIds = [
    'unused-javascript',
    'unminified-javascript',
    'duplicated-javascript',
    'legacy-javascript',
    'dom-size',
    'bootup-time',
    'mainthread-work-breakdown',
    'third-party-facades',
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
        savings: audit.details?.overallSavingsMs
          ? { ms: Math.round(audit.details.overallSavingsMs) }
          : null,
      }
    })
    .filter(Boolean)

  return {
    url,
    fetchedUrl: results.lighthouseResult.finalDisplayedUrl || url,
    timestamp: Date.now(),
    strategy,
    framework: detectFramework(audits),
    performanceScore: Math.round((results.lighthouseResult.categories.performance?.score || 0) * 100),
    tbt: {
      value: tbtValue,
      displayValue: tbt?.displayValue || `${Math.round(tbtValue)}ms`,
      score: tbtScore,
      thresholds: { good: 200, poor: 600 },
    },
    mainThread: {
      total: mainThreadTotal,
      items: mainThreadItems,
    },
    longTasks: longTaskItems,
    thirdParties: thirdPartyItems,
    scripts: scriptItems,
    taskMetrics,
    opportunities,
    screenshot: extractScreenshot(results),
  }
}, {
  base: 'psi',
  swr: true,
  getKey: (event) => {
    const q = getQuery(event)
    return `inp:v1:${q.strategy || 'mobile'}:${q.url}`
  },
  maxAge: 60 * 60,
  staleMaxAge: 24 * 60 * 60,
})
