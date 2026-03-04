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

const RESOURCE_LABELS: Record<string, string> = {
  document: 'Documents',
  stylesheet: 'Stylesheets',
  script: 'Scripts',
  image: 'Images',
  font: 'Fonts',
  media: 'Media',
  other: 'Other',
}

function getResourceType(mimeType: string, _resourceType?: string): string {
  if (_resourceType)
    return _resourceType.toLowerCase()
  const normalized = mimeType.split(';')[0].trim().toLowerCase()
  return RESOURCE_TYPE_MAP[normalized] || 'other'
}

function getDomain(url: string): string {
  return new URL(url).hostname
}

function headersToRecord(headers: Array<{ name: string, value: string }>): Record<string, string> {
  const record: Record<string, string> = {}
  for (const h of headers)
    record[h.name.toLowerCase()] = h.value
  return record
}

function parseHar(input: string | object): ParsedHar {
  const raw = typeof input === 'string' ? JSON.parse(input) : input
  const log = (raw as any).log

  if (!log || !log.entries)
    throw new Error('Invalid HAR file. Expected a "log" object with "entries".')

  const version = log.version || '1.2'
  const pages = (log.pages || []).map((p: any) => ({
    id: p.id,
    title: p.title || 'Untitled',
    onLoad: p.pageTimings?.onLoad ?? 0,
  }))

  const firstStarted = log.entries.length
    ? new Date(log.entries[0].startedDateTime).getTime()
    : 0

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

  const entries: ParsedHarEntry[] = log.entries.map((e: any) => {
    const entryStart = new Date(e.startedDateTime).getTime()
    const offset = entryStart - firstStarted
    const timings = e.timings || {}
    const t = {
      blocked: Math.max(0, timings.blocked ?? 0),
      dns: Math.max(0, timings.dns ?? 0),
      connect: Math.max(0, timings.connect ?? 0),
      ssl: Math.max(0, timings.ssl ?? 0),
      send: Math.max(0, timings.send ?? 0),
      wait: Math.max(0, timings.wait ?? 0),
      receive: Math.max(0, timings.receive ?? 0),
    }
    const entryTime = e.time || (t.blocked + t.dns + t.connect + t.send + t.wait + t.receive)
    const endTime = offset + entryTime
    if (endTime > maxEnd)
      maxEnd = endTime

    // Sizes
    const contentSize = e.response?.content?.size ?? 0
    const xferSize = e._transferSize ?? e.response?.bodySize ?? contentSize
    totalSize += contentSize
    totalTransferSize += xferSize

    // Resource type
    const mimeType = e.response?.content?.mimeType || ''
    const type = getResourceType(mimeType, e._resourceType)

    // Domain
    let domain = ''
    try { domain = getDomain(e.request.url) }
    catch {}

    // Cache
    const fromCache = !!(e._fromCache || e._fromServiceWorker || (e.response?.status === 304))
    if (fromCache)
      cacheHits++
    else cacheMisses++

    // Protocol
    const protocol = e._protocol || e.connection || (e.request.httpVersion?.includes('2') ? 'h2' : e.request.httpVersion?.includes('3') ? 'h3' : 'http/1.1')

    // Aggregate type
    const existing = typeMap.get(type)
    if (existing) { existing.count++; existing.size += xferSize }
    else {
      typeMap.set(type, { count: 1, size: xferSize })
    }

    // Aggregate status
    const status = e.response?.status ?? 0
    statusMap.set(status, (statusMap.get(status) || 0) + 1)

    // Aggregate domain
    if (domain) {
      const d = domainMap.get(domain)
      if (d) { d.count++; d.size += xferSize }
      else {
        domainMap.set(domain, { count: 1, size: xferSize })
      }
    }

    // Aggregate protocol
    const normalizedProtocol = protocol.replace(/^h2.*/, 'h2').replace(/^h3.*/, 'h3') || 'http/1.1'
    protocolMap.set(normalizedProtocol, (protocolMap.get(normalizedProtocol) || 0) + 1)

    // Aggregate timing phases
    phases.blocked += t.blocked
    phases.dns += t.dns
    phases.connect += t.connect
    phases.ssl += t.ssl
    phases.send += t.send
    phases.wait += t.wait
    phases.receive += t.receive

    const reqHeaders = headersToRecord(e.request?.headers || [])
    const resHeaders = headersToRecord(e.response?.headers || [])

    return {
      url: e.request.url,
      method: e.request.method,
      status,
      type,
      size: contentSize,
      transferSize: xferSize,
      time: entryTime,
      timings: t,
      startedDateTime: offset,
      headers: { request: reqHeaders, response: resHeaders },
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
  }
}

export function useHarReport() {
  const report = ref<ParsedHar | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(false)

  function loadFromFile(file: File): Promise<void> {
    loading.value = true
    error.value = null

    return new Promise<void>((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        report.value = parseHar(content)
        loading.value = false
        resolve()
      }
      reader.onerror = () => {
        error.value = 'Failed to read file'
        loading.value = false
        resolve()
      }
      reader.readAsText(file)
    }).catch((err: Error) => {
      error.value = err.message || 'Failed to parse HAR file'
      loading.value = false
    })
  }

  function loadFromText(text: string) {
    loading.value = true
    error.value = null

    Promise.resolve()
      .then(() => {
        report.value = parseHar(text)
        loading.value = false
      })
      .catch((err) => {
        error.value = err.message || 'Failed to parse HAR file'
        loading.value = false
      })
  }

  function clear() {
    report.value = null
    error.value = null
  }

  return { report, error, loading, loadFromFile, loadFromText, clear }
}
