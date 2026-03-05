const validTools: string[] = [
  'pagespeed-insights',
  'lcp-finder',
  'cls-debugger',
  'inp-analyzer',
  'cwv-checker',
  'cwv-history',
  'ttfb-checker',
  'bulk-pagespeed',
  'cwv-compare',
  'lighthouse-report-viewer',
  'lighthouse-score-calculator',
  'page-size',
  'har-viewer',
  'json-size',
]

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    tool: string
    action?: 'view' | 'use' | 'share' | 'export' | 'copy'
  }>(event)

  if (!body?.tool || !validTools.includes(body.tool)) {
    throw createError({ statusCode: 400, message: 'Invalid tool' })
  }

  await trackToolUsage(event, body.tool, body.action || 'use')

  return { ok: true }
})
