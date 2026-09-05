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
 * Reads an IPv6 address as its eight 16-bit groups, or says the text is not
 * one.
 *
 * The URL parser hands the hostname over in its normalized bracketed form
 * (`[::ffff:7f00:1]`, all groups present or one `::`), but the embedded
 * dotted-quad spelling is accepted too so this stays right even for text that
 * skipped that parser.
 */
function ipv6Groups(raw: string): number[] | null {
  let text = raw
  if (text.startsWith('[') && text.endsWith(']'))
    text = text.slice(1, -1)
  if (!text)
    return null

  let head = text
  let tailGroups: number[] = []
  if (text.includes('.')) {
    const lastColon = text.lastIndexOf(':')
    if (lastColon === -1)
      return null
    const quad = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(text.slice(lastColon + 1))
    if (!quad)
      return null
    const bytes = [quad[1], quad[2], quad[3], quad[4]].map(Number)
    if (bytes.some(byte => byte > 255))
      return null
    tailGroups = [(bytes[0]! << 8) | bytes[1]!, (bytes[2]! << 8) | bytes[3]!]
    head = text.slice(0, lastColon)
  }

  const halves = head.split('::')
  if (halves.length > 2)
    return null
  const left = halves[0] === '' ? [] : halves[0]!.split(':')
  const right = halves.length === 2 ? (halves[1] === '' ? [] : halves[1]!.split(':')) : []
  for (const group of [...left, ...right]) {
    if (!/^[0-9a-f]{1,4}$/i.test(group))
      return null
  }

  const fill = 8 - left.length - right.length - tailGroups.length
  if (fill < 0 || (halves.length === 1 && fill !== 0))
    return null

  const parse = (group: string) => Number.parseInt(group, 16)
  const groups: number[] = []
  for (const group of left)
    groups.push(parse(group))
  for (let index = 0; index < fill; index++)
    groups.push(0)
  for (const group of right)
    groups.push(parse(group))
  groups.push(...tailGroups)
  return groups
}

/**
 * The host a guard pattern can reason about.
 *
 * An IPv6 address whose last 32 bits carry an IPv4 address, mapped
 * (`::ffff:0:0/96`) or compatible (`::/96`), is that IPv4 address to the
 * machine that connects. The URL parser keeps such a host in hex form
 * (`[::ffff:7f00:1]`), which the IPv4 patterns would never match, so the
 * canonical form is the embedded dotted quad. Everything else passes through.
 */
function canonicalGuardHost(hostname: string): string {
  if (!hostname.includes(':'))
    return hostname

  const groups = ipv6Groups(hostname)
  if (!groups)
    return hostname

  const firstFiveZero = groups.slice(0, 5).every(group => group === 0)
  const embeddedIPv4 = firstFiveZero && (groups[5] === 0xFFFF || groups[5] === 0)
  if (!embeddedIPv4)
    return hostname

  const bytes = [groups[6]! >> 8, groups[6]! & 0xFF, groups[7]! >> 8, groups[7]! & 0xFF]
  return bytes.join('.')
}

/**
 * Parses one URL into something safe to fetch, or says why it is not.
 *
 * Every URL the measurement touches passes through here once: the submitted
 * page URL, every ref read out of the fetched HTML, and every redirect hop a
 * response names. The last two are page-author controlled, which is why the
 * guard runs on each of them.
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

  if (BLOCKED_HOST_PATTERNS.some(pattern => pattern.test(canonicalGuardHost(url.hostname))))
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

/**
 * The named character references markup can carry in an attribute value.
 *
 * HTML decodes these before a browser fetches, so this reads the value the way
 * the browser would. Numeric references (`&#38;`, `&#x26;`) cover the rest.
 */
const NAMED_CHARACTER_REFERENCES: Record<string, string> = {
  amp: '&',
  AMP: '&',
  lt: '<',
  LT: '<',
  gt: '>',
  GT: '>',
  quot: '"',
  QUOT: '"',
  apos: '\'',
  nbsp: '\u00A0',
  NBSP: '\u00A0',
}

/** The character HTML substitutes for a reference that names nothing valid. */
const INVALID_CHARACTER_REFERENCE = '\uFFFD'

function codePointToCharacter(code: number): string {
  // HTML maps NUL, surrogates, and anything past the Unicode range to U+FFFD.
  if (code <= 0 || code > 0x10FFFF || (code >= 0xD800 && code <= 0xDFFF))
    return INVALID_CHARACTER_REFERENCE
  return String.fromCodePoint(code)
}

function decodeCharacterReferences(value: string): string {
  return value.replace(
    /&(?:#(\d+)|#x([0-9a-f]+)|([a-z][a-z0-9]*));/gi,
    (whole, decimal: string | undefined, hexadecimal: string | undefined, name: string | undefined) => {
      if (decimal !== undefined)
        return codePointToCharacter(Number(decimal))
      if (hexadecimal !== undefined)
        return codePointToCharacter(Number.parseInt(hexadecimal, 16))
      return NAMED_CHARACTER_REFERENCES[name!] ?? whole
    },
  )
}

/**
 * Pulls one attribute out of a tag's attribute text.
 *
 * The name is anchored on the left, since `\b` holds between `-` and a letter
 * and would read `data-src` as `src`. The captured value is decoded, because
 * the browser fetches `/px?a=1&b=2` when the markup says `&amp;`, and the
 * encoded spelling would otherwise dodge the seen-dedupe.
 */
function attribute(tag: string, name: string): string | null {
  const match = tag.match(new RegExp(`(?<![\\w-])${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, 'i'))
  if (!match)
    return null
  const value = match[1] ?? match[2] ?? match[3]
  return value === undefined ? null : decodeCharacterReferences(value)
}

/** The first candidate in a `srcset`, which is the one a plain reader would take. */
function firstSrcsetCandidate(srcset: string): string | null {
  const first = srcset.split(',')[0]?.trim().split(/\s+/)[0]
  return first || null
}

/** Tags whose content is text, not markup, so anything inside them is not a tag. */
const RAW_TEXT_ELEMENTS = new Set(['script', 'style', 'textarea', 'title'])

/** The elements that can name a subresource. */
const RESOURCE_ELEMENTS = new Set(['script', 'link', 'img', 'source', 'video', 'audio', 'iframe', 'embed', 'object', 'track'])

interface ScannedTag {
  name: string
  attrs: string
}

/**
 * Walks the HTML and yields each resource tag with its attribute text.
 *
 * A regex cannot do this. `<[^>]*>` ends the tag at the first `>`, and a `>`
 * inside a quoted attribute value is legal HTML, so `<img alt="a > b" src=…>`
 * loses its `src` and the resource disappears from the total. The same scan
 * has to skip comments and the contents of script and style, or a tag written
 * inside either is counted as a resource the page never requests.
 */
function* scanTags(html: string): Generator<ScannedTag> {
  let index = 0

  while (index < html.length) {
    const open = html.indexOf('<', index)
    if (open === -1)
      return

    if (html.startsWith('<!--', open)) {
      const close = html.indexOf('-->', open + 4)
      // An unterminated comment runs to the end of the document.
      if (close === -1)
        return
      index = close + 3
      continue
    }

    const nameMatch = /^<([a-z][a-z0-9-]*)/i.exec(html.slice(open, open + 32))
    if (!nameMatch) {
      index = open + 1
      continue
    }

    const name = nameMatch[1]!.toLowerCase()
    let cursor = open + nameMatch[0].length
    let quote: string | null = null

    // Walk to the tag's real end, ignoring a `>` inside a quoted value.
    while (cursor < html.length) {
      const char = html[cursor]!
      if (quote) {
        if (char === quote)
          quote = null
      }
      else if (char === '"' || char === '\'') {
        quote = char
      }
      else if (char === '>') {
        break
      }
      cursor++
    }

    const attrs = html.slice(open + nameMatch[0].length, cursor)
    const selfClosing = attrs.trimEnd().endsWith('/')

    if (RESOURCE_ELEMENTS.has(name))
      yield { name, attrs }

    index = cursor + 1

    // Everything inside a raw text element is text. Skipping it stops a tag
    // written in a string or a stylesheet from being read as markup.
    if (RAW_TEXT_ELEMENTS.has(name) && !selfClosing) {
      const closing = html.toLowerCase().indexOf(`</${name}`, index)
      if (closing === -1)
        return
      index = closing + name.length + 2
    }
  }
}

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

  for (const { name: tag, attrs } of scanTags(html)) {
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
    else if (tag === 'object') {
      // `object` names its resource with `data`, not `src`.
      raw = attribute(attrs, 'data')
      hinted = null
    }
    else if (tag === 'iframe' || tag === 'embed') {
      raw = attribute(attrs, 'src')
      hinted = null
    }
    else if (tag === 'track') {
      raw = attribute(attrs, 'src')
      hinted = 'other'
    }
    else {
      raw = attribute(attrs, 'src')
      hinted = 'media'
    }

    // A poster loads with the media element, so it counts as its own resource.
    if (tag === 'video' || tag === 'audio') {
      const poster = attribute(attrs, 'poster')
      if (poster) {
        const parsedPoster = parsePublicHttpUrl(poster.trim(), baseUrl)
        if (parsedPoster._tag === 'ok') {
          const posterHref = parsedPoster.url.toString()
          if (!seen.has(posterHref)) {
            seen.add(posterHref)
            refs.push({ url: posterHref, type: 'image' })
          }
        }
      }
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

/** The redirect statuses the fetch spec follows. */
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308])

/** The most hops one request may chase before it gives up, as a browser would. */
export const MAX_REDIRECT_HOPS = 5

export type RedirectHop
  = | { _tag: 'follow', url: string }
    | { _tag: 'blocked' }
    | { _tag: 'not-redirect' }

/**
 * Reads where a redirect response says to go next.
 *
 * - `follow`: the Location resolved and passed the public-host guard; chase it.
 * - `blocked`: the hop is missing or points somewhere this tool never fetches.
 * - `not-redirect`: the response is the answer, not a signpost.
 *
 * Redirects are followed by hand for exactly this check: the platform's
 * `follow` mode would hop to an internal address the guard never saw.
 */
export function redirectHop(response: Response, baseUrl: string): RedirectHop {
  if (!REDIRECT_STATUSES.has(response.status))
    return { _tag: 'not-redirect' }

  const location = response.headers.get('location')
  if (!location)
    return { _tag: 'blocked' }

  const parsed = parsePublicHttpUrl(location, baseUrl)
  return parsed._tag === 'ok' ? { _tag: 'follow', url: parsed.url.toString() } : { _tag: 'blocked' }
}

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
 * - `absent`: the server answered and the answer was definitive. An error
 *   status after every probe, or a redirect leading somewhere this tool will
 *   not follow. This is a fact about the page, so it does not make a
 *   measurement incomplete.
 * - `unmeasured`: the run could not find out. The clock, the byte cap, or a
 *   connection that never produced an answer. This is what makes a measurement
 *   incomplete.
 *
 * The split is the difference between a page and a network. Only a response
 * says something about the page. A rejected fetch is a reset, a refused
 * connection, a DNS failure or a TLS error, and the same request a moment later
 * may well succeed, so treating one as `absent` would quietly shrink the total
 * while still calling the run complete.
 *
 * Every path reports the identity length, so these are uncompressed bytes.
 */
export async function measureResource(url: string, options: MeasureResourceOptions): Promise<MeasureOutcome> {
  const doFetch = options.fetchLike ?? globalThis.fetch
  const budget = () => Math.min(options.timeoutMs, options.deadline - Date.now())

  const attempt = (target: string, init: RequestInit): Promise<Response | MeasureOutcome> => {
    if (budget() <= 0)
      return Promise.resolve({ _tag: 'unmeasured' })
    return doFetch(target, {
      ...init,
      headers: { 'user-agent': options.userAgent, ...(init.headers as Record<string, string> | undefined) },
      redirect: 'manual',
      signal: AbortSignal.timeout(budget()),
    }).then(
      response => response,
      // No response means no answer about the page, whether the clock ran out
      // or the connection failed. Either way the size stays unknown.
      (): MeasureOutcome => ({ _tag: 'unmeasured' }),
    )
  }

  /**
   * Runs one probe, following only redirect hops the guard calls public.
   *
   * A hop the guard refuses, or a chase that never settles, means the resource
   * answers with nowhere public to measure: `absent`, a fact about the page.
   */
  const probe = async (init: RequestInit): Promise<Response | MeasureOutcome> => {
    let target = url
    for (let hop = 0; hop <= MAX_REDIRECT_HOPS; hop++) {
      const response = await attempt(target, init)
      if ('_tag' in response)
        return response

      const next = redirectHop(response, target)
      if (next._tag === 'not-redirect')
        return response
      if (next._tag === 'blocked')
        return { _tag: 'absent' }
      target = next.url
    }
    return { _tag: 'absent' }
  }

  const probes: RequestInit[] = [
    { method: 'HEAD' },
    { headers: { range: 'bytes=0-0' } },
  ]

  for (const probeInit of probes) {
    const probed = await probe(probeInit)
    if ('_tag' in probed)
      return probed

    const sized = sizeFromHeaders(probed)
    if (sized)
      return { _tag: 'measured', size: sized.size, contentType: sized.contentType }
  }

  const response = await probe({})
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
