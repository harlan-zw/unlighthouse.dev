import { detectFramework, extractScreenshot, fetchPSI } from '../../utils/psi'

interface LayoutShiftElement {
  node: string
  nodeLabel: string
  selector: string
  score: number
  boundingRect?: {
    top: number
    right: number
    bottom: number
    left: number
    width: number
    height: number
  }
}

interface LayoutShiftCluster {
  clusterStartTime: number
  clusterEndTime: number
  clusterDuration: number
  clusterScore: number
  shifts: Array<{
    startTime: number
    score: number
    impactedNodes: Array<{
      node: string
      nodeLabel: string
      selector: string
      previousRect?: { top: number, left: number, width: number, height: number }
      currentRect?: { top: number, left: number, width: number, height: number }
    }>
  }>
}

export default defineCachedEventHandler(async (event) => {
  const query = getQuery(event)
  const url = await validateUrl(query.url as string)
  const strategy = (query.strategy === 'desktop' ? 'desktop' : 'mobile') as 'mobile' | 'desktop'

  const results = await fetchPSI(event, url, strategy)
  const audits = results.lighthouseResult.audits

  // CLS metric
  const clsAudit = audits['cumulative-layout-shift']
  const clsValue = clsAudit?.numericValue || 0
  const clsScore = Math.round((clsAudit?.score || 0) * 100)
  const clsDisplayValue = clsAudit?.displayValue || clsValue.toFixed(3)

  // Layout shift elements - the main offenders
  const layoutShiftElementsAudit = audits['layout-shift-elements']
  const shiftElements: LayoutShiftElement[] = (layoutShiftElementsAudit?.details?.items || []).map((item: Record<string, unknown>) => {
    const node = item.node as Record<string, unknown> | undefined
    return {
      node: (node?.snippet as string) || '',
      nodeLabel: (node?.nodeLabel as string) || '',
      selector: (node?.selector as string) || '',
      score: (item.score as number) || 0,
      boundingRect: node?.boundingRect as LayoutShiftElement['boundingRect'],
    }
  })

  // Layout shifts audit - detailed breakdown with clusters
  const layoutShiftsAudit = audits['layout-shifts']
  const shiftClusters: LayoutShiftCluster[] = []

  if (layoutShiftsAudit?.details?.items) {
    for (const cluster of layoutShiftsAudit.details.items as Array<Record<string, unknown>>) {
      const shifts: LayoutShiftCluster['shifts'] = []

      if (cluster.subItems && (cluster.subItems as Record<string, unknown>).items) {
        const subItems = (cluster.subItems as Record<string, unknown>).items as Array<Record<string, unknown>>
        for (const shift of subItems) {
          const impactedNodes: LayoutShiftCluster['shifts'][0]['impactedNodes'] = []

          if (shift.impactedNodes && Array.isArray(shift.impactedNodes)) {
            for (const nodeInfo of shift.impactedNodes as Array<Record<string, unknown>>) {
              const node = nodeInfo.node as Record<string, unknown> | undefined
              impactedNodes.push({
                node: (node?.snippet as string) || '',
                nodeLabel: (node?.nodeLabel as string) || '',
                selector: (node?.selector as string) || '',
                previousRect: nodeInfo.previousRect as { top: number, left: number, width: number, height: number } | undefined,
                currentRect: nodeInfo.currentRect as { top: number, left: number, width: number, height: number } | undefined,
              })
            }
          }

          shifts.push({
            startTime: (shift.startTime as number) || 0,
            score: (shift.score as number) || 0,
            impactedNodes,
          })
        }
      }

      shiftClusters.push({
        clusterStartTime: (cluster.startTime as number) || 0,
        clusterEndTime: (cluster.startTime as number) + (cluster.duration as number) || 0,
        clusterDuration: (cluster.duration as number) || 0,
        clusterScore: (cluster.clusterScore as number) || (cluster.score as number) || 0,
        shifts,
      })
    }
  }

  // Common causes of CLS
  const clsCauses: Array<{ id: string, title: string, description: string, severity: 'high' | 'medium' | 'low' }> = []

  // Check for images without dimensions
  const unsizedImages = audits['unsized-images']
  if (unsizedImages && unsizedImages.score !== 1 && unsizedImages.details?.items?.length) {
    clsCauses.push({
      id: 'unsized-images',
      title: `${unsizedImages.details.items.length} image${unsizedImages.details.items.length > 1 ? 's' : ''} without dimensions`,
      description: 'Images without width/height attributes cause layout shifts when they load. Add explicit dimensions.',
      severity: 'high',
    })
  }

  // Check for non-composited animations
  const nonCompositedAnimations = audits['non-composited-animations']
  if (nonCompositedAnimations && nonCompositedAnimations.score !== 1 && nonCompositedAnimations.details?.items?.length) {
    clsCauses.push({
      id: 'non-composited-animations',
      title: 'Animations trigger layout',
      description: 'Some CSS animations cause layout recalculation. Use transform and opacity for smoother animations.',
      severity: 'medium',
    })
  }

  // Check for layout shift causing insights
  const clsInsight = audits['cls-culprits-insight']
  const clsCulprits: Array<{ cause: string, elements: string[] }> = []
  if (clsInsight?.details?.items) {
    for (const item of clsInsight.details.items as Array<Record<string, unknown>>) {
      if (item.cause && item.elements) {
        clsCulprits.push({
          cause: item.cause as string,
          elements: (item.elements as Array<{ node?: { nodeLabel?: string } }>).map(e => e.node?.nodeLabel || 'Unknown').filter(Boolean),
        })
      }
    }
  }

  // Font-related CLS
  const fontDisplay = audits['font-display']
  if (fontDisplay && fontDisplay.score !== 1 && fontDisplay.details?.items?.length) {
    clsCauses.push({
      id: 'font-display',
      title: 'Font loading causes shifts',
      description: 'Web fonts without font-display: swap can cause invisible text and layout shifts. Use font-display: optional for best CLS.',
      severity: 'medium',
    })
  }

  // Resource summary for context
  const resourceSummary = audits['resource-summary']
  const resources = (resourceSummary?.details?.items || []).map((item: Record<string, unknown>) => ({
    type: item.resourceType as string,
    label: item.label as string,
    count: item.requestCount as number,
    size: item.transferSize as number,
  }))

  // Screenshot timeline (filmstrip)
  const filmstrip = audits['screenshot-thumbnails']
  const filmstripItems = (filmstrip?.details?.items || []).slice(0, 10).map((item: Record<string, unknown>) => ({
    timing: item.timing as number,
    data: item.data as string,
  }))

  const screenshot = extractScreenshot(results)
  const framework = detectFramework(audits)

  // Get unsized images list for display
  const unsizedImagesList = (unsizedImages?.details?.items || []).slice(0, 5).map((item: Record<string, unknown>) => {
    const node = item.node as Record<string, unknown> | undefined
    return {
      url: (item.url as string) || (node?.snippet as string)?.match(/src="([^"]+)"/)?.[1] || '',
      snippet: (node?.snippet as string) || '',
      selector: (node?.selector as string) || '',
    }
  })

  return {
    url,
    fetchedUrl: results.lighthouseResult.finalDisplayedUrl || url,
    timestamp: Date.now(),
    strategy,
    framework,
    performanceScore: Math.round((results.lighthouseResult.categories.performance?.score || 0) * 100),
    cls: {
      value: clsValue,
      displayValue: clsDisplayValue,
      score: clsScore,
      thresholds: { good: 0.1, poor: 0.25 },
    },
    shiftElements,
    shiftClusters,
    clsCauses,
    clsCulprits,
    unsizedImages: unsizedImagesList,
    resources,
    filmstrip: filmstripItems,
    screenshot,
  }
}, {
  base: 'psi',
  swr: true,
  getKey: (event) => {
    const q = getQuery(event)
    return `cls:v1:${q.strategy || 'mobile'}:${q.url}`
  },
  maxAge: 60 * 60,
  staleMaxAge: 24 * 60 * 60,
})
