import type { WeightEntry } from '~~/shared/page-weight'
import {
  classifyResource,
  extractResourceRefs,
  parsePublicHttpUrl,
  summarizeWeight,
} from '~~/shared/page-weight'

/**
 * The fast half of the page size tool.
 *
 * `page-size` reads its numbers from a PageSpeed Insights Lighthouse run, which
 * takes around 25 seconds. A visitor reported that wait as too slow, and page
 * weight does not need Lighthouse: the bytes are on the wire. This reads them
 * directly so the breakdown appears while Lighthouse is still running, and
 * `page-size` fills in the audit-derived panels behind it.
 *
 * The total is a floor. No JavaScript runs here, so a resource a script fetches
 * later is not counted. The response says so in `complete`, and the UI repeats
 * it, because a number presented as the whole truth would be wrong.
 */

/** Nothing is fetched past this, so one enormous page cannot hold a Worker open. */
const RESOURCE_LIMIT = 120
/** Requests in flight at once. High enough to stay fast, low enough to not look like an attack. */
const CONCURRENCY = 16
const DOCUMENT_TIMEOUT_MS = 10_000
const RESOURCE_TIMEOUT_MS = 5_000
/**
 * The whole measurement stops here.
 *
 * The point of this endpoint is a number that arrives before Lighthouse does,
 * so it is bounded by design rather than by how well a site behaves. A run that
 * runs out reports what it measured and says it is incomplete.
 */
const TOTAL_BUDGET_MS = 8_000
/** A browser identifies itself, and plenty of servers vary their response when a client does not. */
const USER_AGENT = 'Mozilla/5.0 (compatible; UnlighthouseBot/1.0; +https://unlighthouse.dev/tools/page-size)'

/**
 * Reads a size out of response headers without downloading anything.
 *
 * `Content-Range` carries the full length even on a one-byte request, and
 * `Content-Length` answers on a HEAD that bothers to send it. A compressed
 * chunked response sends neither, which is why a download is still the last
 * resort.
 */
function sizeFromHeaders(response: Response | null): { size: number, contentType: string | null } | null {
  if (!response)
    return null

  const contentRange = response.headers.get('content-range')
  const total = contentRange ? Number(contentRange.split('/')[1]) : Number.NaN
  if (Number.isFinite(total) && total > 0)
    return { size: total, contentType: response.headers.get('content-type') }

  if (!response.ok)
    return null

  const declared = Number(response.headers.get('content-length'))
  // A one-byte length is the range response itself, not the resource.
  if (Number.isFinite(declared) && declared > 1)
    return { size: declared, contentType: response.headers.get('content-type') }

  return null
}

/**
 * Measures one resource, spending as little as the server allows.
 *
 * Servers disagree about which cheap probe they answer. Cloudflare in front of
 * this site answers HEAD with a length; nuxt.com answers HEAD with no length at
 * all but serves ranges. Trying both before downloading turns most resources
 * into one small round trip instead of a full transfer.
 *
 * Every path reports the identity length, so these are uncompressed bytes. The
 * response labels them that way, because the transfer figure Lighthouse reports
 * is a different, smaller number.
 */
async function measure(url: string, deadline: number): Promise<{ size: number, contentType: string | null } | null> {
  const budget = () => Math.min(RESOURCE_TIMEOUT_MS, deadline - Date.now())

  const probes: RequestInit[] = [
    { method: 'HEAD' },
    { headers: { range: 'bytes=0-0' } },
  ]

  for (const probe of probes) {
    if (budget() <= 0)
      return null

    const response = await fetch(url, {
      ...probe,
      headers: { 'user-agent': USER_AGENT, ...(probe.headers as Record<string, string> | undefined) },
      redirect: 'follow',
      signal: AbortSignal.timeout(budget()),
    }).catch(() => {
      // A subresource that refuses, times out, or blocks this fetch is a normal
      // result for a page on the open web, not a fault in this tool. It is
      // reported as unmeasured through `complete` rather than failing the run.
      return null
    })

    const sized = sizeFromHeaders(response)
    if (sized)
      return sized
  }

  if (budget() <= 0)
    return null

  const response = await fetch(url, {
    headers: { 'user-agent': USER_AGENT },
    redirect: 'follow',
    signal: AbortSignal.timeout(budget()),
  }).catch(() => {
    // Same as above: an unreachable resource is counted as unmeasured.
    return null
  })

  if (!response || !response.ok)
    return null

  const body = await response.arrayBuffer().catch(() => {
    // A body that stops mid-stream leaves no length to report, so the resource
    // is counted as unmeasured rather than guessed at.
    return null
  })

  return body ? { size: body.byteLength, contentType: response.headers.get('content-type') } : null
}

/** Runs `work` over `items`, never more than `limit` at a time. */
async function mapWithLimit<T, R>(items: readonly T[], limit: number, work: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = Array.from({ length: items.length })
  let next = 0

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const index = next++
      if (index >= items.length)
        return
      results[index] = await work(items[index]!)
    }
  }))

  return results
}

export default defineCachedEventHandler(async (event) => {
  await checkFreeToolRateLimit(event)
  const query = getQuery(event)
  const validated = await validateUrl(query.url as string)

  const parsed = parsePublicHttpUrl(validated)
  if (parsed._tag === 'err')
    throw createError({ statusCode: 422, message: `Cannot measure this URL: ${parsed.reason}` })
  const pageUrl = parsed.url.toString()

  return trackToolRequest(event, { tool: 'page-size', url: pageUrl }, async () => {
    const document = await fetch(pageUrl, {
      headers: { 'user-agent': USER_AGENT },
      redirect: 'follow',
      signal: AbortSignal.timeout(DOCUMENT_TIMEOUT_MS),
    }).catch(() => {
      // The reason the page did not load is upstream detail, and forwarding it
      // would put the visitor's URL into this site's error text. The 502 below
      // is the whole answer.
      return null
    })

    if (!document || !document.ok)
      throw createError({ statusCode: 502, message: 'Could not load the page' })

    const finalUrl = document.url || pageUrl
    const html = await document.text()
    const documentEntry: WeightEntry = {
      url: finalUrl,
      type: 'document',
      size: new TextEncoder().encode(html).byteLength,
    }

    const refs = extractResourceRefs(html, finalUrl)
    const measured = refs.slice(0, RESOURCE_LIMIT)

    const deadline = Date.now() + TOTAL_BUDGET_MS
    const entries = await mapWithLimit(measured, CONCURRENCY, async (ref): Promise<WeightEntry | null> => {
      const result = await measure(ref.url, deadline)
      if (!result)
        return null
      return {
        url: ref.url,
        // The server's own answer beats the guess made from the tag.
        type: classifyResource(ref.url, result.contentType) === 'other' ? ref.type : classifyResource(ref.url, result.contentType),
        size: result.size,
      }
    })

    const found = entries.filter((entry): entry is WeightEntry => entry !== null)
    const { totalSize, totalRequests, groups, largestResources } = summarizeWeight([documentEntry, ...found])
    const complete = refs.length <= RESOURCE_LIMIT && found.length === measured.length

    return {
      url: pageUrl,
      fetchedUrl: finalUrl,
      timestamp: Date.now(),
      /**
       * Uncompressed bytes, not transfer bytes.
       *
       * Every size here is the resource's identity length, which is what a
       * range or a length header reports and what a decoded download measures.
       * The transfer figure is smaller and comes from Lighthouse, so the two
       * are shown as the separate numbers they are.
       */
      totalUncompressedSize: totalSize,
      totalRequests,
      groups,
      largestResources,
      /**
       * False when a resource went unmeasured, so nothing downstream presents a
       * partial total as the page weight. A page that is slow or hostile to
       * range requests can exhaust the budget with most of itself unread, and a
       * total that is short by half is worse than no total at all.
       */
      complete,
      discovered: refs.length,
      measured: found.length,
      skipped: Math.max(0, refs.length - measured.length),
    }
  })
}, {
  base: 'psi',
  swr: true,
  getKey: event => `page-weight:v1:${getQuery(event).url}`,
  maxAge: 60 * 60,
  staleMaxAge: 24 * 60 * 60,
})
