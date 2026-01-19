import type { H3Event } from 'h3'

const _fetchPSI = cachedFunction(async (url: string, strategy: 'mobile' | 'desktop', token: string): Promise<PSIResult> => {
  const psiUrl = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed')
  psiUrl.searchParams.set('url', url)
  psiUrl.searchParams.set('category', 'PERFORMANCE')
  psiUrl.searchParams.set('strategy', strategy)
  psiUrl.searchParams.set('key', token)

  return $fetch<PSIResult>(psiUrl.toString())
}, {
  base: 'psi',
  swr: true,
  getKey: (url: string, strategy: string) => `raw:v1:${strategy}:${url}`,
  maxAge: 60 * 60,
  staleMaxAge: 24 * 60 * 60,
})

export function fetchPSI(event: H3Event, url: string, strategy: 'mobile' | 'desktop' = 'mobile'): Promise<PSIResult> {
  const token = useRuntimeConfig(event).googleApiToken
  if (!token)
    throw createError({ message: 'NUXT_GOOGLE_API_TOKEN not configured', statusCode: 500 })

  return _fetchPSI(url, strategy, token)
}

// Extract framework from network requests
export function detectFramework(audits: PSIResult['lighthouseResult']['audits']): string | null {
  const networkRequests = audits['network-requests']?.details?.items as Array<{ url?: string }> | undefined
  const urlString = (networkRequests || []).map(r => r.url || '').join(' ')

  if (urlString.includes('/_nuxt/'))
    return 'nuxt'
  if (urlString.includes('/_next/'))
    return 'next'
  if (urlString.includes('/assets/') && urlString.includes('vite'))
    return 'vite'

  return null
}

// Extract full page screenshot
export function extractScreenshot(result: PSIResult) {
  const screenshot = result.lighthouseResult.fullPageScreenshot?.screenshot
  if (!screenshot?.data)
    return null

  return {
    data: screenshot.data,
    width: screenshot.width || 0,
    height: screenshot.height || 0,
  }
}

// Extract opportunities from audits
export function extractOpportunities(audits: PSIResult['lighthouseResult']['audits'], auditIds: string[]) {
  return auditIds
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
          ? { ms: audit.details.overallSavingsMs, bytes: audit.details.overallSavingsBytes }
          : null,
      }
    })
    .filter(Boolean)
}

export interface PSIResult {
  lighthouseResult: {
    finalDisplayedUrl?: string
    fullPageScreenshot?: {
      screenshot?: {
        data?: string
        width?: number
        height?: number
      }
    }
    categories: {
      performance?: { score: number }
    }
    audits: Record<string, {
      score: number | null
      numericValue?: number
      displayValue?: string
      title?: string
      description?: string
      details?: {
        items?: Array<{
          node?: ElementNode
          element?: ElementNode
          type?: string
          snippet?: string
          nodeLabel?: string
          selector?: string
          boundingRect?: BoundingRect
        }>
        overallSavingsMs?: number
        overallSavingsBytes?: number
      }
    }>
  }
}

interface ElementNode {
  nodeLabel?: string
  nodeName?: string
  snippet?: string
  selector?: string
  path?: string
  boundingRect?: BoundingRect
}

interface BoundingRect {
  top: number
  right: number
  bottom: number
  left: number
  width: number
  height: number
}
