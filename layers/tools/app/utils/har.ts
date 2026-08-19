export interface ParsedHarEntry {
  url: string
  method: string
  status: number
  type: string
  size: number
  transferSize: number
  time: number
  timings: { blocked: number, dns: number, connect: number, ssl: number, send: number, wait: number, receive: number }
  startedDateTime: number // ms offset from first request
  headers: { request: Record<string, string>, response: Record<string, string> }
  fromCache: boolean
  protocol: string
  domain: string
}

export interface ParsedHar {
  version: string
  pages: { id: string, title: string, onLoad: number }[]
  totalRequests: number
  totalSize: number
  totalTransferSize: number
  totalTime: number
  entries: ParsedHarEntry[]
  resourceBreakdown: { type: string, label: string, count: number, size: number }[]
  statusBreakdown: { status: number, count: number }[]
  domainBreakdown: { domain: string, count: number, size: number }[]
  timingPhases: { phase: string, total: number }[]
  cacheStats: { hits: number, misses: number, hitRate: number }
  protocolBreakdown: { protocol: string, count: number }[]
}

/** Why a HAR document could not be read. */
export type ParseHarReason = 'invalid-json' | 'invalid-har'

/**
 * Outcome of reading a HAR document.
 *
 * A person uploads this file, so a malformed one is ordinary input, not a defect. The parser
 * returns the failure instead of throwing. Throwing is what sent every bad upload to Sentry: the
 * throw happened inside a `FileReader` callback, where no `catch` in the composable could see it.
 */
export type ParseHarResult
  = | { _tag: 'Ok', report: ParsedHar }
    | { _tag: 'Err', reason: ParseHarReason, message: string }

const RESOURCE_TYPE_MAP: Record<string, string> = {
  'text/html': 'document',
  'text/css': 'stylesheet',
  'application/javascript': 'script',
  'text/javascript': 'script',
  'application/json': 'script',
  'image/png': 'image',
  'image/jpeg': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'image/avif': 'image',
  'image/svg+xml': 'image',
  'font/woff': 'font',
  'font/woff2': 'font',
  'application/font-woff': 'font',
  'application/font-woff2': 'font',
  'video/mp4': 'media',
  'audio/mpeg': 'media',
}

const H2_RE = /^h2.*/
const H3_RE = /^h3.*/

const RESOURCE_LABELS: Record<string, string> = {
  document: 'Documents',
  stylesheet: 'Stylesheets',
  script: 'Scripts',
  image: 'Images',
  font: 'Fonts',
  media: 'Media',
  other: 'Other',
}

const INVALID_HAR_MESSAGE = 'Invalid HAR file. Expected a "log" object with an "entries" list.'
const INVALID_JSON_MESSAGE = 'Invalid HAR file. The file is not valid JSON.'

function getResourceType(mimeType: string, resourceType?: string): string {
  if (resourceType)
    return resourceType.toLowerCase()
  const normalized = (mimeType.split(';')[0] || '').trim().toLowerCase()
  return RESOURCE_TYPE_MAP[normalized] || 'other'
}

function readDomain(url: string): string {
  // A HAR can carry a relative or malformed URL. Those entries get the empty-domain bucket.
  try {
    return new URL(url).hostname
  }
  catch {
    return ''
  }
}

function headersToRecord(headers: unknown): Record<string, string> {
  const record: Record<string, string> = {}
  if (!Array.isArray(headers))
    return record
  for (const header of headers) {
    const name = header?.name
    if (typeof name === 'string')
      record[name.toLowerCase()] = String(header?.value ?? '')
  }
  return record
}

function readTimestamp(value: unknown): number {
  const parsed = typeof value === 'string' || typeof value === 'number' ? new Date(value).getTime() : Number.NaN
  return Number.isFinite(parsed) ? parsed : 0
}

function readNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

/**
 * Read a HAR document into a report, or say why it could not be read.
 *
 * Every entry field is optional in practice. Browsers, proxies, and CLI tools all emit HAR, and
 * they disagree about which keys they write, so each one is read defensively and an entry with no
 * request is skipped rather than failing the whole upload.
 */
export function parseHar(input: string | object): ParseHarResult {
  let raw: unknown = input

  if (typeof input === 'string') {
    try {
      raw = JSON.parse(input)
    }
    catch {
      return { _tag: 'Err', reason: 'invalid-json', message: INVALID_JSON_MESSAGE }
    }
  }

  const log = (raw as { log?: unknown } | null)?.log as { entries?: unknown, pages?: unknown, version?: unknown } | undefined
  if (!log || typeof log !== 'object' || !Array.isArray(log.entries))
    return { _tag: 'Err', reason: 'invalid-har', message: INVALID_HAR_MESSAGE }

  const rawEntries = (log.entries as Array<Record<string, any> | null>).filter(entry => !!entry?.request)

  const version = typeof log.version === 'string' ? log.version : '1.2'
  const pages = (Array.isArray(log.pages) ? log.pages : []).map((page: any) => ({
    id: String(page?.id ?? ''),
    title: page?.title || 'Untitled',
    onLoad: readNumber(page?.pageTimings?.onLoad),
  }))

  const firstStarted = rawEntries.length ? readTimestamp(rawEntries[0]?.startedDateTime) : 0

  const typeMap = new Map<string, { count: number, size: number }>()
  const statusMap = new Map<number, number>()
  const domainMap = new Map<string, { count: number, size: number }>()
  const protocolMap = new Map<string, number>()
  const phases = { blocked: 0, dns: 0, connect: 0, ssl: 0, send: 0, wait: 0, receive: 0 }
  let cacheHits = 0
  let cacheMisses = 0
  let totalSize = 0
  let totalTransferSize = 0
  let maxEnd = 0

  const entries: ParsedHarEntry[] = rawEntries.map((entry: any) => {
    const offset = readTimestamp(entry.startedDateTime) - firstStarted
    const timings = entry.timings || {}
    const t = {
      blocked: Math.max(0, readNumber(timings.blocked)),
      dns: Math.max(0, readNumber(timings.dns)),
      connect: Math.max(0, readNumber(timings.connect)),
      ssl: Math.max(0, readNumber(timings.ssl)),
      send: Math.max(0, readNumber(timings.send)),
      wait: Math.max(0, readNumber(timings.wait)),
      receive: Math.max(0, readNumber(timings.receive)),
    }
    const entryTime = readNumber(entry.time) || (t.blocked + t.dns + t.connect + t.send + t.wait + t.receive)
    const endTime = offset + entryTime
    if (endTime > maxEnd)
      maxEnd = endTime

    // Sizes
    const contentSize = readNumber(entry.response?.content?.size)
    const xferSize = readNumber(entry._transferSize, readNumber(entry.response?.bodySize, contentSize))
    totalSize += contentSize
    totalTransferSize += xferSize

    // Resource type
    const mimeType = typeof entry.response?.content?.mimeType === 'string' ? entry.response.content.mimeType : ''
    const type = getResourceType(mimeType, typeof entry._resourceType === 'string' ? entry._resourceType : undefined)

    const url = typeof entry.request?.url === 'string' ? entry.request.url : ''
    const domain = readDomain(url)

    // Cache
    const status = readNumber(entry.response?.status)
    const fromCache = !!(entry._fromCache || entry._fromServiceWorker || status === 304)
    if (fromCache)
      cacheHits++
    else
      cacheMisses++

    // Protocol
    const httpVersion = typeof entry.request?.httpVersion === 'string' ? entry.request.httpVersion : ''
    const protocol = String(
      entry._protocol
      || entry.connection
      || (httpVersion.includes('2') ? 'h2' : httpVersion.includes('3') ? 'h3' : 'http/1.1'),
    )

    // Aggregate type
    const existing = typeMap.get(type)
    if (existing) {
      existing.count++
      existing.size += xferSize
    }
    else {
      typeMap.set(type, { count: 1, size: xferSize })
    }

    // Aggregate status
    statusMap.set(status, (statusMap.get(status) || 0) + 1)

    // Aggregate domain
    if (domain) {
      const d = domainMap.get(domain)
      if (d) {
        d.count++
        d.size += xferSize
      }
      else {
        domainMap.set(domain, { count: 1, size: xferSize })
      }
    }

    // Aggregate protocol
    const normalizedProtocol = protocol.replace(H2_RE, 'h2').replace(H3_RE, 'h3') || 'http/1.1'
    protocolMap.set(normalizedProtocol, (protocolMap.get(normalizedProtocol) || 0) + 1)

    // Aggregate timing phases
    phases.blocked += t.blocked
    phases.dns += t.dns
    phases.connect += t.connect
    phases.ssl += t.ssl
    phases.send += t.send
    phases.wait += t.wait
    phases.receive += t.receive

    return {
      url,
      method: typeof entry.request?.method === 'string' ? entry.request.method : '',
      status,
      type,
      size: contentSize,
      transferSize: xferSize,
      time: entryTime,
      timings: t,
      startedDateTime: offset,
      headers: {
        request: headersToRecord(entry.request?.headers),
        response: headersToRecord(entry.response?.headers),
      },
      fromCache,
      protocol: normalizedProtocol,
      domain,
    }
  })

  const resourceBreakdown = Array.from(typeMap.entries())
    .map(([type, data]) => ({ type, label: RESOURCE_LABELS[type] || type, ...data }))
    .sort((a, b) => b.size - a.size)

  const statusBreakdown = Array.from(statusMap.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => a.status - b.status)

  const domainBreakdown = Array.from(domainMap.entries())
    .map(([domain, data]) => ({ domain, ...data }))
    .sort((a, b) => b.size - a.size)

  const protocolBreakdown = Array.from(protocolMap.entries())
    .map(([protocol, count]) => ({ protocol, count }))
    .sort((a, b) => b.count - a.count)

  const timingPhases = Object.entries(phases)
    .map(([phase, total]) => ({ phase, total }))

  const totalRequests = entries.length
  const totalCounted = cacheHits + cacheMisses

  return {
    _tag: 'Ok',
    report: {
      version,
      pages,
      totalRequests,
      totalSize,
      totalTransferSize,
      totalTime: maxEnd,
      entries,
      resourceBreakdown,
      statusBreakdown,
      domainBreakdown,
      timingPhases,
      cacheStats: {
        hits: cacheHits,
        misses: cacheMisses,
        hitRate: totalCounted > 0 ? cacheHits / totalCounted : 0,
      },
      protocolBreakdown,
    },
  }
}
