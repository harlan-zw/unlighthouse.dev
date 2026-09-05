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
