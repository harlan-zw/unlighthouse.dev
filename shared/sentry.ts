/**
 * Marks an error this site raised on purpose because a provider we call failed.
 *
 * A Google outage is not a defect in this site. The endpoints still answer the browser with a
 * gateway status, and this marker records why.
 */
export const EXPECTED_UPSTREAM_FAILURE = 'expected-upstream-failure'

/** `createError` input for a provider failure. */
export interface UpstreamFailureErrorOptions {
  statusCode: number
  statusMessage: string
  message: string
  data: {
    reason: typeof EXPECTED_UPSTREAM_FAILURE
    upstreamStatus: number | null
  }
}

/**
 * Matches every message `describePsiFailure` and `describeCruxFailure` produce.
 *
 * `@harlan-zw/nuxt-sentry` reads no marker from `data`, so the Drop Rule matches the message
 * instead. `nuxtSentry.policy.ignoreErrors` uses this pattern. If you add a provider failure
 * message, add it here, or the outage returns as an issue.
 */
export const EXPECTED_UPSTREAM_FAILURE_MESSAGE_RE
  = /(?:PageSpeed Insights|Chrome UX Report) (?:is rate limited right now|could not (?:analyse|look up) this URL|did not return a result for this URL)/
