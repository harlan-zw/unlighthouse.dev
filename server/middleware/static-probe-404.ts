import type { H3Event } from 'h3'
import { defineEventHandler, getRequestURL, setResponseHeaders, setResponseStatus } from 'h3'
import { isStaticProbePath } from '~~/shared/static-probe-404'

const STATIC_PROBE_404_HEADERS = {
  'content-type': 'text/plain; charset=utf-8',
  'cache-control': 'no-store',
  'cloudflare-cdn-cache-control': 'public, max-age=300',
  'x-robots-tag': 'noindex',
} as const

export function handleStaticProbe404(event: H3Event): string | undefined {
  const url = getRequestURL(event)
  if (!isStaticProbePath(url.pathname))
    return

  setResponseStatus(event, 404, 'Not Found')
  setResponseHeaders(event, STATIC_PROBE_404_HEADERS)
  return event.req.method === 'HEAD' ? '' : 'Not Found'
}

export default defineEventHandler((event) => {
  // In dev and build prerender, Nitro serves public static files after middleware.
  if (import.meta.dev || import.meta.prerender)
    return

  return handleStaticProbe404(event)
})
