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

/**
 * Browser fetch rejections a client reports with no stack.
 *
 * Nuxt polls `/_nuxt/builds/meta/*` for the app manifest. When the network drops that poll,
 * the browser rejects on the global handler with `TypeError: Failed to fetch`. The same
 * network failure can also surface as `Error: NetworkError: A network error occurred.`
 * (a DOMException with code 19). Both arrive with an empty frame list, and no frame names
 * site code, so neither report can be acted on.
 *
 * `nuxtSentry.policy.dropStacklessErrors` drops these messages only when the report carries
 * no stack frame. The same message with a stack is a defect here and still reports.
 */
export const STACKLESS_FETCH_FAILURE_MESSAGE_RE
  = /^(?:TypeError: Failed to fetch|Error: NetworkError: A network error occurred\.)$/
