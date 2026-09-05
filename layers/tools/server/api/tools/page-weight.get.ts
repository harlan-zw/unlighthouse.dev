import type { WeightEntry } from '~~/shared/page-weight'
import {
  assessCompleteness,
  classifyResource,
  extractResourceRefs,
  MAX_BODY_BYTES,
  measureResource,
  parsePublicHttpUrl,
  readBodyCapped,
  RESOURCE_LIMIT,
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

type SubresourceOutcome
  = | { _tag: 'measured', entry: WeightEntry }
    | { _tag: 'absent' }
    | { _tag: 'unmeasured' }

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
    const body = await readBodyCapped(document, MAX_BODY_BYTES)
    if (body._tag === 'over-cap')
      throw createError({ statusCode: 413, message: 'This page is too large for the fast measurement' })
    const html = new TextDecoder().decode(body.bytes)
    const documentEntry: WeightEntry = {
      url: finalUrl,
      type: 'document',
      size: body.bytes.byteLength,
    }

    const refs = extractResourceRefs(html, finalUrl)
    const attempted = refs.slice(0, RESOURCE_LIMIT)

    const deadline = Date.now() + TOTAL_BUDGET_MS
    const outcomes = await mapWithLimit(attempted, CONCURRENCY, async (ref): Promise<SubresourceOutcome> => {
      const result = await measureResource(ref.url, {
        deadline,
        timeoutMs: RESOURCE_TIMEOUT_MS,
        maxBodyBytes: MAX_BODY_BYTES,
        userAgent: USER_AGENT,
      })
      if (result._tag !== 'measured')
        return result
      return {
        _tag: 'measured',
        entry: {
          url: ref.url,
          // The server's own answer beats the guess made from the tag.
          type: classifyResource(ref.url, result.contentType) === 'other' ? ref.type : classifyResource(ref.url, result.contentType),
          size: result.size,
        },
      }
    })

    const found: WeightEntry[] = []
    let absent = 0
    let unmeasured = 0
    for (const outcome of outcomes) {
      if (outcome._tag === 'measured')
        found.push(outcome.entry)
      else if (outcome._tag === 'absent')
        absent++
      else
        unmeasured++
    }

    // Any unmeasured resource means the run stopped early, whether the clock
    // or the byte cap stopped it. An absent resource means no such thing.
    const assessment = assessCompleteness(refs.length, attempted.length, found.length, unmeasured > 0)
    const { totalSize, totalRequests, groups, largestResources } = summarizeWeight([documentEntry, ...found])

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
       * False when the run stopped early, so nothing downstream presents a
       * partial total as the page weight. A resource that answered 404 is not
       * a stop: it is counted in `absent` and the total stands. A page that is
       * slow, hostile to range requests, or past the resource limit leaves
       * part of itself unread, and a total that is short by half is worse
       * than no total at all.
       */
      complete: assessment.complete,
      discovered: refs.length,
      measured: found.length,
      /**
       * Resources that answered with an error after every probe (404, 401,
       * refused). They contribute no bytes. Absent is a fact about the page,
       * not about this run.
       */
      absent,
      skipped: assessment.skipped,
    }
  })
}, {
  base: 'psi',
  swr: true,
  getKey: event => `page-weight:v2:${getQuery(event).url}`,
  maxAge: 60 * 60,
  staleMaxAge: 24 * 60 * 60,
})
