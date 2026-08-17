import type { UpstreamFailureErrorOptions } from './sentry.ts'
import { EXPECTED_UPSTREAM_FAILURE } from './sentry.ts'

export type PsiStrategy = 'mobile' | 'desktop'

const PSI_ENDPOINT = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'

/**
 * Build the PageSpeed Insights request URL.
 *
 * The API key is deliberately absent. It travels in the `X-Goog-Api-Key` header instead, so a
 * failed request cannot carry the key into an error message, a log line, or a Sentry issue title.
 */
export function buildPsiRequestUrl(url: string, strategy: PsiStrategy): string {
  const psiUrl = new URL(PSI_ENDPOINT)
  psiUrl.searchParams.set('url', url)
  psiUrl.searchParams.set('category', 'PERFORMANCE')
  psiUrl.searchParams.set('strategy', strategy)
  return psiUrl.toString()
}

export interface PsiFailure {
  /** Status this site returns to the browser. */
  statusCode: number
  /** Status Google returned, or null when the request never completed. */
  upstreamStatus: number | null
  message: string
}

function readUpstreamStatus(error: unknown): number | null {
  if (!error || typeof error !== 'object')
    return null

  const candidate = error as { response?: { status?: unknown }, status?: unknown, statusCode?: unknown }
  const status = candidate.response?.status ?? candidate.status ?? candidate.statusCode

  return typeof status === 'number' && status >= 100 && status <= 599 ? status : null
}

/**
 * Describe a failed PageSpeed Insights call.
 *
 * The upstream message is never forwarded. Google echoes the whole request URL in its fetch errors,
 * so forwarding it is what leaked the API key into Sentry.
 */
export function describePsiFailure(error: unknown): PsiFailure {
  const upstreamStatus = readUpstreamStatus(error)

  if (upstreamStatus === 429) {
    return {
      statusCode: 429,
      upstreamStatus,
      message: 'PageSpeed Insights is rate limited right now. Wait a minute, then try again.',
    }
  }

  if (upstreamStatus !== null && upstreamStatus >= 400 && upstreamStatus < 500) {
    return {
      statusCode: 422,
      upstreamStatus,
      message: 'PageSpeed Insights could not analyse this URL. Check that the page is public and loads without a redirect.',
    }
  }

  return {
    statusCode: 502,
    upstreamStatus,
    message: 'PageSpeed Insights did not return a result for this URL. This is a Google outage, not a problem with the page.',
  }
}

/**
 * Build the `createError` input for a failed PageSpeed Insights call.
 *
 * The marker in `data` is what keeps a Google outage out of Sentry. Raise every PageSpeed failure
 * through here, never through a bare `createError`, or the outage returns as an issue.
 */
export function psiFailureErrorOptions(error: unknown): UpstreamFailureErrorOptions {
  const failure = describePsiFailure(error)

  return {
    statusCode: failure.statusCode,
    statusMessage: failure.message,
    message: failure.message,
    data: {
      reason: EXPECTED_UPSTREAM_FAILURE,
      upstreamStatus: failure.upstreamStatus,
    },
  }
}
