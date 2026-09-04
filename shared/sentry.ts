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
 * The Nuxt app manifest fetch failure a browser reports with no stack.
 *
 * Nuxt polls `/_nuxt/builds/meta/*` for the app manifest. When the network drops that poll,
 * the browser rejects on the global handler and Sentry records `TypeError: Failed to fetch`
 * with an empty frame list. No frame names site code, so the report cannot be acted on.
 *
 * `nuxtSentry.policy.dropStacklessErrors` drops this message only when the report carries no
 * stack frame. The same message with a stack is a defect here and still reports.
 */
export const STACKLESS_FETCH_FAILURE_MESSAGE_RE = /^TypeError: Failed to fetch$/

/**
 * The failure the Carbon Ads vendor script raises when an ad blocker removed its tag.
 *
 * The vendor script reads `.src` off its own tag, which it looks up with
 * `document.getElementById('_carbonads_js')`. An ad blocker removes that node first, so the
 * lookup returns null and the read throws. The failure happens inside the vendor script and
 * no site code can fix it, so the report is noise in the issue feed.
 *
 * `nuxtSentry.policy.ignoreErrors` uses this pattern. Browsers word the message differently
 * and do not all label it a TypeError, so the pattern matches the element id the vendor
 * script alone uses. This site never references that id, and a report naming it names the
 * vendor script.
 */
export const CARBONADS_SCRIPT_ELEMENT_RE = /_carbonads_js/
