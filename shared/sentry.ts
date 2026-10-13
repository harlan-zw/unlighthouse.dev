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
 * Matches every message this site raises for a failure upstream of it: what
 * `describePsiFailure` and `describeCruxFailure` produce, and the two answers
 * the page weight handler raises for a measured site that is the condition
 * itself, one that did not load and one past the byte cap.
 *
 * `@harlan-zw/nuxt-sentry` reads no marker from `data`, so the Drop Rule matches the message
 * instead. `nuxtSentry.policy.ignoreErrors` uses this pattern. If you add a provider failure
 * message, add it here, or the outage returns as an issue.
 */
export const EXPECTED_UPSTREAM_FAILURE_MESSAGE_RE
  = /(?:(?:PageSpeed Insights|Chrome UX Report) (?:is rate limited right now|could not (?:analyse|look up) this URL|did not return a result for this URL)|The measured site did not load|This page is too large for the fast measurement)/

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
 * The vendor fetch failure a browser reports with the host in the message.
 *
 * UNLIGHTHOUSE-M records `TypeError: Failed to fetch (selnor.fun)`. The suffix names a
 * host this site never contacts, so the fetch belongs to a vendor script. Its frames
 * arrive anonymous: they name no file, so the report cannot be acted on.
 *
 * Firefox words a same-origin fetch failure the same way, with the full site URL in
 * the suffix, e.g. `TypeError: Failed to fetch (https://unlighthouse.dev/_api/measure)`.
 * That failure is a defect here, so the pattern anchors the suffix to the vendor host:
 * a site-origin URL starts with the site scheme and never matches.
 *
 * `nuxtSentry.policy.ignoreErrors` uses this pattern. `dropStacklessErrors` cannot carry
 * it, because that drop needs an empty frame list and anonymous frames are present, so
 * the gate never fires. The bare `STACKLESS_FETCH_FAILURE_MESSAGE_RE` keeps its own rule,
 * so the unsuffixed message with a stack still reports.
 */
export const SUFFIXED_FETCH_FAILURE_MESSAGE_RE = /^TypeError: Failed to fetch \(selnor\.fun[^)]*\)$/

/**
 * The secondhand fetch failure the nuxt-og-image resolve route raises for a visitor's probe.
 *
 * UNLIGHTHOUSE-N records `[Nuxt OG Image] Failed to fetch /test: unknown error`. A visitor
 * requested the og:image of a path that does not exist. The resolve route fetched that path,
 * Nitro answered 404, and the route raised that answer as its own statusMessage. The report
 * describes the visitor's probe, so no site code can act on it.
 *
 * The tail of the message words the reason differently per fetch path, and the route's own
 * fallback reads `unknown error`, so the pattern matches the module prefix and the leading
 * slash of the probed path. It stays unanchored: `@harlan-zw/nuxt-sentry` composes the text
 * it matches as `type: value`, so the message arrives behind the error type. The route also
 * raises a 404 when a page loads without the og:image meta. That message names the meta,
 * never matches, and that defect still reports.
 *
 * `nuxtSentry.policy.ignoreErrors` uses this pattern. The server policy drops status 404 by
 * default, yet this sighting reached the issue feed, so the message carries the drop.
 */
export const OG_IMAGE_404_MESSAGE_RE = /\[Nuxt OG Image\] Failed to fetch \//

/**
 * The network failure a plain-http page load reports with no stack.
 *
 * A page served over plain http rejects a resource load with `NetworkError: A network
 * error occurred.` on the global handler. No frame names site code, so the report
 * cannot be acted on.
 *
 * Sentry composes the message it matches as `type: value`, and the two sightings do not
 * agree on the type. UNLIGHTHOUSE-7695975530 carries the bare `NetworkError` type, while
 * UNLIGHTHOUSE-D is a DOMException with code 19 that Sentry labels `Error`. The optional
 * `Error: ` prefix covers both, so neither sighting depends on which type Sentry picks.
 *
 * `nuxtSentry.policy.dropStacklessErrors` drops this message only when the report carries no
 * stack frame. The same message with a stack is a defect here and still reports.
 */
export const STACKLESS_NETWORK_ERROR_MESSAGE_RE = /^(?:Error: )?NetworkError: A network error occurred\.$/

/**
 * Rejections whose captured value is not an `Error`.
 *
 * When the Carbon Ads script's fetch fails, Safari rejects on the global handler with a
 * `CustomEvent` or a bare object instead of an `Error`. Sentry serializes those reasons as
 * `Event \`CustomEvent\` (type=unhandledrejection) captured as promise rejection` and
 * `Object captured as promise rejection with keys: [object has no keys]`. No frame names
 * site code, so the report cannot be acted on.
 *
 * `nuxtSentry.policy.dropStacklessErrors` drops these messages only when the report carries no
 * stack frame. The same capture with a stack is a defect here and still reports.
 */
export const STACKLESS_NON_ERROR_REJECTION_DROP_RULE
  = /(?:Event `[^`]+` \(type=[^)]+\)|Object) captured as promise rejection/

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

/**
 * The origin that serves the Carbon Ads vendor script.
 *
 * Browsers word the null read differently and V8 omits the evaluated expression, so the
 * Chrome wording of the failure never names the element id `CARBONADS_SCRIPT_ELEMENT_RE`
 * matches. The origin names the vendor script alone, and `nuxtSentry.policy.denyUrls` drops
 * a report only when every stack frame matches, so a failure reaching site code still
 * reports.
 */
export const CARBONADS_VENDOR_ORIGIN_RE = /cdn\.carbonads\.com/
