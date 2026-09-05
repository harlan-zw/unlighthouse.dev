/**
 * The pure half of the fast page weight measurement.
 *
 * The tool used to get every number from a PageSpeed Insights Lighthouse run,
 * which takes around 25 seconds. This module reads the same page directly, so
 * the weight and the resource breakdown can be shown while Lighthouse is still
 * running. It performs no IO, so every rule here is testable on its own.
 *
 * What it cannot see: this reads the HTML the server sent. It runs no
 * JavaScript, so a resource a script fetches later is not counted. The total is
 * a floor, not the full picture, and the UI says so.
 */

/** The resource kinds the breakdown reports, matching Lighthouse's own grouping. */
export type ResourceType = 'document' | 'script' | 'stylesheet' | 'image' | 'font' | 'media' | 'other'

export interface ResourceRef {
  url: string
  type: ResourceType
}

export type UrlParse
  = | { _tag: 'ok', url: URL }
    | { _tag: 'err', reason: string }

/**
 * Hosts a measurement must never fetch.
 *
 * Lighthouse ran on Google's infrastructure, so a hostile URL reached Google
 * rather than this Worker. Reading the page here makes that this site's
 * request, so a literal address pointing back inside a network is refused
 * before any fetch. Names are not resolved here, so this stops literals only;
 * the platform is what stops a name that resolves inward.
 */
const BLOCKED_HOST_PATTERNS: RegExp[] = [
  /^localhost$/i,
  /\.localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(?:1[6-9]|2\d|3[01])\./,
  /^169\.254\./,
  /^0\./,
  /^\[?::1\]?$/,
  /^\[?f[cd][0-9a-f]{2}:/i,
  /^\[?fe80:/i,
]

/**
 * Parses one URL into something safe to fetch, or says why it is not.
 *
 * Every URL the measurement touches passes through here once, including the
 * ones read out of the fetched HTML, which the page author controls.
 */
export function parsePublicHttpUrl(raw: string, base?: string): UrlParse {
  let url: URL
  try {
    url = base ? new URL(raw, base) : new URL(raw)
  }
  catch {
    return { _tag: 'err', reason: 'not a URL' }
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:')
    return { _tag: 'err', reason: `unsupported scheme ${url.protocol}` }

  if (!url.hostname)
    return { _tag: 'err', reason: 'no host' }

  if (BLOCKED_HOST_PATTERNS.some(pattern => pattern.test(url.hostname)))
    return { _tag: 'err', reason: 'host is not public' }

  return { _tag: 'ok', url }
}

const EXTENSION_TYPES: Array<[RegExp, ResourceType]> = [
  [/\.(?:js|mjs|cjs|jsx|ts|tsx)(?:$|\?)/i, 'script'],
  [/\.css(?:$|\?)/i, 'stylesheet'],
  [/\.(?:png|jpe?g|gif|webp|avif|svg|ico|bmp)(?:$|\?)/i, 'image'],
  [/\.(?:woff2?|ttf|otf|eot)(?:$|\?)/i, 'font'],
  [/\.(?:mp4|webm|ogg|mp3|wav|m4a|mov)(?:$|\?)/i, 'media'],
]

const CONTENT_TYPE_TYPES: Array<[RegExp, ResourceType]> = [
  [/^text\/html/i, 'document'],
  [/javascript|ecmascript/i, 'script'],
  [/^text\/css/i, 'stylesheet'],
  [/^image\//i, 'image'],
  [/^font\/|application\/(?:x-)?font|application\/vnd\.ms-fontobject/i, 'font'],
  [/^(?:audio|video)\//i, 'media'],
]

/**
 * Names a resource, preferring what the server said over what the URL implies.
 *
 * A URL extension is a guess: plenty of scripts are served from paths with no
 * extension at all. The `Content-Type` is the server's own answer, so it wins
 * whenever there is one.
 */
export function classifyResource(url: string, contentType?: string | null): ResourceType {
  if (contentType) {
    for (const [pattern, type] of CONTENT_TYPE_TYPES) {
      if (pattern.test(contentType))
        return type
    }
  }

  for (const [pattern, type] of EXTENSION_TYPES) {
    if (pattern.test(url))
      return type
  }

  return 'other'
}

/** Pulls one attribute out of a tag's attribute text. */
function attribute(tag: string, name: string): string | null {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, 'i'))
  if (!match)
    return null
  return match[1] ?? match[2] ?? match[3] ?? null
}

/** The first candidate in a `srcset`, which is the one a plain reader would take. */
function firstSrcsetCandidate(srcset: string): string | null {
  const first = srcset.split(',')[0]?.trim().split(/\s+/)[0]
  return first || null
}

const TAG_RE = /<(script|link|img|source|video|audio)\b([^>]*)>/gi

/**
 * Reads every subresource the served HTML asks for.
 *
 * Duplicates collapse, because a browser fetches one URL once however many
 * tags name it. Anything that is not a public http URL is dropped here rather
 * than at fetch time, so one rule decides what this tool will request.
 */
export function extractResourceRefs(html: string, baseUrl: string): ResourceRef[] {
  const seen = new Set<string>()
  const refs: ResourceRef[] = []

  for (const match of html.matchAll(TAG_RE)) {
    const tag = match[1]!.toLowerCase()
    const attrs = match[2] ?? ''

    let raw: string | null = null
    let hinted: ResourceType | null = null

    if (tag === 'script') {
      raw = attribute(attrs, 'src')
      hinted = 'script'
    }
    else if (tag === 'link') {
      const rel = (attribute(attrs, 'rel') || '').toLowerCase()
      // Only the rels that make the browser fetch bytes for this page.
      if (!/\b(?:stylesheet|preload|modulepreload|icon)\b/.test(rel))
        continue
      raw = attribute(attrs, 'href')
      if (rel.includes('stylesheet'))
        hinted = 'stylesheet'
      const asAttr = (attribute(attrs, 'as') || '').toLowerCase()
      if (asAttr === 'font')
        hinted = 'font'
      else if (asAttr === 'style')
        hinted = 'stylesheet'
      else if (asAttr === 'script')
        hinted = 'script'
      else if (asAttr === 'image' || rel.includes('icon'))
        hinted = 'image'
    }
    else if (tag === 'img' || tag === 'source') {
      const srcset = attribute(attrs, 'srcset')
      raw = (srcset ? firstSrcsetCandidate(srcset) : null) || attribute(attrs, 'src')
      hinted = tag === 'img' ? 'image' : null
    }
    else {
      raw = attribute(attrs, 'src')
      hinted = 'media'
    }

    if (!raw)
      continue

    const parsed = parsePublicHttpUrl(raw.trim(), baseUrl)
    if (parsed._tag === 'err')
      continue

    const href = parsed.url.toString()
    if (seen.has(href))
      continue
    seen.add(href)

    refs.push({ url: href, type: hinted ?? classifyResource(href) })
  }

  return refs
}

/** Nothing is fetched past this, so one enormous page cannot hold a Worker open. */
export const RESOURCE_LIMIT = 120

/** The most of one body this tool will ever hold in memory. */
export const MAX_BODY_BYTES = 5 * 1024 * 1024

export type BodyRead
  = | { _tag: 'ok', bytes: Uint8Array }
    | { _tag: 'over-cap' }

function concatChunks(chunks: Uint8Array[], total: number): Uint8Array {
  const bytes = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return bytes
}

/**
 * Reads a response body under a hard byte cap.
 *
 * The cap is what bounds memory. The reader stops and cancels the stream the
 * moment the body passes it, so a fast endless stream cannot fill the Worker's
 * isolate. `over-cap` says the resource is bigger than anything this tool
 * would report.
 */
export async function readBodyCapped(response: Response, cap: number): Promise<BodyRead> {
  const body = response.body
  if (!body)
    return { _tag: 'ok', bytes: new Uint8Array(0) }

  const reader = body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done)
      return { _tag: 'ok', bytes: concatChunks(chunks, total) }

    total += value.byteLength
    if (total > cap) {
      await reader.cancel().catch(() => {
        // A cancel on a stream that already failed can reject. That changes
        // nothing: the outcome is already decided.
      })
      return { _tag: 'over-cap' }
    }
    chunks.push(value)
  }
}

export type MeasureOutcome
  = | { _tag: 'measured', size: number, contentType: string | null }
    | { _tag: 'absent' }
    | { _tag: 'unmeasured' }

export interface MeasureResourceOptions {
  /** Absolute time after which the whole run stops. */
  deadline: number
  /** The longest a single resource may take. */
  timeoutMs: number
  /** The most of one body to hold in memory. */
  maxBodyBytes: number
  userAgent: string
  /** The fetch to use. Production passes the platform fetch; tests pass a stub. */
  fetchLike?: typeof fetch
}

/** True for a rejection the clock caused, where waiting longer could still succeed. */
function isTimedOut(error: unknown): boolean {
  return error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')
}

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
 * this site answers HEAD with a length; nuxt.com answers HEAD with no length
 * at all but serves ranges. Trying HEAD, then a one-byte range, then a
 * download turns most resources into one small round trip.
 *
 * The outcome says which of three things happened:
 * - `measured`: a size is known.
 * - `absent`: the resource is definitively not there. It answered with an
 *   error status after every probe, or the connection failed in a way more
 *   time would not fix. This is a fact about the page, so it does not make a
 *   measurement incomplete.
 * - `unmeasured`: the run could not read it. The clock or the byte cap
 *   stopped it. This is what makes a measurement incomplete.
 *
 * Every path reports the identity length, so these are uncompressed bytes.
 */
export async function measureResource(url: string, options: MeasureResourceOptions): Promise<MeasureOutcome> {
  const doFetch = options.fetchLike ?? globalThis.fetch
  const budget = () => Math.min(options.timeoutMs, options.deadline - Date.now())

  const attempt = (init: RequestInit): Promise<Response | MeasureOutcome> => {
    if (budget() <= 0)
      return Promise.resolve({ _tag: 'unmeasured' })
    return doFetch(url, {
      ...init,
      headers: { 'user-agent': options.userAgent, ...(init.headers as Record<string, string> | undefined) },
      redirect: 'follow',
      signal: AbortSignal.timeout(budget()),
    }).then(
      response => response,
      (error: unknown): MeasureOutcome => isTimedOut(error) ? { _tag: 'unmeasured' } : { _tag: 'absent' },
    )
  }

  const probes: RequestInit[] = [
    { method: 'HEAD' },
    { headers: { range: 'bytes=0-0' } },
  ]

  for (const probe of probes) {
    const probed = await attempt(probe)
    if ('_tag' in probed)
      return probed

    const sized = sizeFromHeaders(probed)
    if (sized)
      return { _tag: 'measured', size: sized.size, contentType: sized.contentType }
  }

  const response = await attempt({})
  if ('_tag' in response)
    return response

  if (!response.ok)
    return { _tag: 'absent' }

  const body = await readBodyCapped(response, options.maxBodyBytes).catch(() => {
    // A body that stops mid-stream leaves no length to report, so the
    // resource is counted as unmeasured rather than guessed at.
    return null
  })

  if (!body || body._tag === 'over-cap')
    return { _tag: 'unmeasured' }

  return { _tag: 'measured', size: body.bytes.byteLength, contentType: response.headers.get('content-type') }
}

export interface WeightEntry {
  url: string
  type: ResourceType
  size: number
}

export interface ResourceGroup {
  type: ResourceType
  count: number
  size: number
}

export interface WeightSummary {
  totalSize: number
  totalRequests: number
  groups: ResourceGroup[]
  largestResources: Array<{ url: string, size: number, type: ResourceType }>
}

/** How many entries the "largest resources" list shows, matching the PSI panel. */
const LARGEST_RESOURCE_COUNT = 10

/** Groups measured resources into the breakdown the tool renders. */
export function summarizeWeight(entries: readonly WeightEntry[]): WeightSummary {
  const groups = new Map<ResourceType, ResourceGroup>()

  for (const entry of entries) {
    const group = groups.get(entry.type) ?? { type: entry.type, count: 0, size: 0 }
    group.count++
    group.size += entry.size
    groups.set(entry.type, group)
  }

  return {
    totalSize: entries.reduce((total, entry) => total + entry.size, 0),
    totalRequests: entries.length,
    groups: [...groups.values()].sort((a, b) => b.size - a.size),
    largestResources: [...entries]
      .sort((a, b) => b.size - a.size)
      .slice(0, LARGEST_RESOURCE_COUNT)
      .map(({ url, size, type }) => ({ url, size, type })),
  }
}

export interface WeightCompleteness {
  complete: boolean
  /** Resources discovered but never attempted, because the limit stopped the run. */
  skipped: number
}

/**
 * Decides whether a run measured the whole page.
 *
 * A resource that is gone is part of the truth: a 404 or a refused connection
 * contributes no bytes and the total still stands. Only a run that stopped
 * early leaves the total short. That happens when the clock or the byte cap
 * cut resources unread, or when more resources were discovered than the limit
 * allows.
 *
 * - `discovered`: every resource the HTML asks for.
 * - `attempted`: the ones the run tried to measure.
 * - `measured`: the ones that produced a size.
 * - `budgetExhausted`: true when the run stopped before reading everything it
 *   attempted.
 */
export function assessCompleteness(
  discovered: number,
  attempted: number,
  measured: number,
  budgetExhausted: boolean,
): WeightCompleteness {
  return {
    complete: discovered <= RESOURCE_LIMIT && (!budgetExhausted || measured >= attempted),
    skipped: Math.max(0, discovered - attempted),
  }
}
