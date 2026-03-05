export default defineCachedEventHandler(async (event) => {
  await checkFreeToolRateLimit(event)
  const query = getQuery(event)
  const url = await validateUrl(query.url as string)
  const strategy = (query.strategy === 'desktop' ? 'desktop' : 'mobile') as 'mobile' | 'desktop'

  await trackToolUsage(event, 'page-size', 'use')
  await trackToolLookup(event, 'page-size', url, strategy)

  const results = await fetchPSI(event, url, strategy)
  const audits = results.lighthouseResult.audits

  // Resource summary breakdown
  const resourceSummary = audits['resource-summary']
  const resources = (resourceSummary?.details?.items || []).map((item: Record<string, unknown>) => ({
    type: item.resourceType as string,
    label: item.label as string,
    count: item.requestCount as number,
    size: item.transferSize as number,
  }))

  // Total byte weight audit — per-resource details
  const totalByteWeight = audits['total-byte-weight']
  const largestResources = (totalByteWeight?.details?.items || [])
    .slice(0, 10)
    .map((item: Record<string, unknown>) => ({
      url: item.url as string,
      size: item.totalBytes as number,
    }))

  // Third-party summary
  const thirdParties = audits['third-parties-insight']
  const thirdPartyItems = (thirdParties?.details?.items || []).map((item: Record<string, unknown>) => ({
    entity: item.entity as string,
    size: (item.transferSize as number) || 0,
    mainThreadTime: (item.mainThreadTime as number) || 0,
  }))
  const thirdPartyTotalSize = thirdPartyItems.reduce((s: number, t: { size: number }) => s + t.size, 0)

  // Total transfer size from resource summary
  const totalRow = resources.find((r: { type: string }) => r.type === 'total')
  const totalSize = totalRow?.size || 0
  const totalRequests = totalRow?.count || 0

  // Diagnostics — uncompressed size
  const diagnostics = audits.diagnostics?.details?.items?.[0] as Record<string, number> | undefined
  const totalUncompressedSize = diagnostics?.totalByteWeight || 0

  // Unused bytes (JS + CSS)
  const unusedJsBytes = audits['unused-javascript']?.details?.overallSavingsBytes || 0
  const unusedCssBytes = audits['unused-css-rules']?.details?.overallSavingsBytes || 0
  const unusedBytes = (unusedJsBytes as number) + (unusedCssBytes as number)

  // Performance score
  const performanceScore = Math.round((results.lighthouseResult.categories.performance?.score || 0) * 100)

  return {
    url,
    fetchedUrl: results.lighthouseResult.finalDisplayedUrl || url,
    timestamp: Date.now(),
    strategy,
    performanceScore,
    totalSize,
    totalUncompressedSize,
    totalRequests,
    compressionRatio: totalUncompressedSize > 0 ? totalUncompressedSize / Math.max(totalSize, 1) : 1,
    resources: resources.filter((r: { type: string }) => r.type !== 'total'),
    largestResources,
    thirdPartySize: thirdPartyTotalSize,
    thirdPartyPercent: totalSize > 0 ? (thirdPartyTotalSize / totalSize) * 100 : 0,
    thirdPartyDomains: thirdPartyItems.slice(0, 10),
    unusedBytes,
    unusedPercent: totalSize > 0 ? (unusedBytes / totalSize) * 100 : 0,
    screenshot: extractScreenshot(results),
  }
}, {
  base: 'psi',
  swr: true,
  getKey: (event) => {
    const q = getQuery(event)
    return `page-size:v1:${q.strategy || 'mobile'}:${q.url}`
  },
  maxAge: 60 * 60,
  staleMaxAge: 24 * 60 * 60,
})
