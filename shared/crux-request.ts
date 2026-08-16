export type CruxEndpoint = 'current' | 'history'

const CRUX_ENDPOINTS = {
  current: 'https://chromeuxreport.googleapis.com/v1/records:queryRecord',
  history: 'https://chromeuxreport.googleapis.com/v1/records:queryHistoryRecord',
} as const

/**
 * Build the Chrome UX Report request URL.
 *
 * The API key is deliberately absent. It travels in the `X-Goog-Api-Key` header instead, so a
 * failed request cannot carry the key into an error message, a log line, or a Sentry issue title.
 */
export function buildCruxRequestUrl(endpoint: CruxEndpoint): string {
  return CRUX_ENDPOINTS[endpoint]
}

export interface CruxFailure {
  /** Status this site returns to the browser. */
  statusCode: number
  message: string
}

export function readUpstreamStatus(error: unknown): number | null {
  if (!error || typeof error !== 'object')
    return null

  const candidate = error as { response?: { status?: unknown }, status?: unknown, statusCode?: unknown }
  const status = candidate.response?.status ?? candidate.status ?? candidate.statusCode

  return typeof status === 'number' && status >= 100 && status <= 599 ? status : null
}

/**
 * Describe a failed Chrome UX Report call.
 *
 * The upstream message is never forwarded. Google echoes the whole request URL in its fetch errors,
 * so forwarding it would leak the API key the same way the PageSpeed Insights errors did.
 */
export function describeCruxFailure(error: unknown): CruxFailure {
  const upstreamStatus = readUpstreamStatus(error)

  if (upstreamStatus === 429) {
    return {
      statusCode: 429,
      message: 'Chrome UX Report is rate limited right now. Wait a minute, then try again.',
    }
  }

  if (upstreamStatus !== null && upstreamStatus >= 400 && upstreamStatus < 500) {
    return {
      statusCode: 422,
      message: 'Chrome UX Report could not look up this URL. Check that the page is public and that the API key is valid.',
    }
  }

  return {
    statusCode: upstreamStatus ?? 502,
    message: 'Chrome UX Report did not return a result for this URL. This is a Google outage, not a problem with the page.',
  }
}
