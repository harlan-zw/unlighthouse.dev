import type { H3Event } from 'h3'
import type { ToolId } from '../../shared/tool-catalog'
import { toolLookups } from '../database/schema'
import { getDB } from './db'
import { runWithToolOutcome } from './tool-outcome'

const SESSION_COOKIE = 'analytics-session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

export function getSessionId(event: H3Event): string {
  const existing = getCookie(event, SESSION_COOKIE)
  if (existing)
    return existing
  const id = crypto.randomUUID().substring(0, 8)
  setCookie(event, SESSION_COOKIE, id, { maxAge: SESSION_MAX_AGE, path: '/', httpOnly: true, sameSite: 'lax' })
  return id
}

export interface AnalyticsDataPoint {
  blobs: string[]
  doubles: number[]
  indexes?: string[]
}

export function getAnalyticsEngine(event: H3Event) {
  return (event.context.cloudflare?.env as { TOOL_ANALYTICS?: { writeDataPoint: (dataPoint: AnalyticsDataPoint) => void } } | undefined)?.TOOL_ANALYTICS
}

export async function trackToolUsage(
  event: H3Event,
  toolId: ToolId,
  action: 'view' | 'use' | 'share' | 'export' | 'copy',
  metadata?: {
    resultCount?: number
    responseTime?: number
    error?: boolean
  },
) {
  const analytics = getAnalyticsEngine(event)
  if (!analytics)
    return

  const sessionId = getSessionId(event)
  const timestamp = Date.now()

  const dataPoint: AnalyticsDataPoint = {
    blobs: [
      'tool',
      toolId,
      action,
      sessionId,
      metadata?.error ? 'error' : 'success',
    ],
    doubles: [
      timestamp,
      metadata?.responseTime || 0,
      metadata?.resultCount || 0,
    ],
    indexes: [sessionId.substring(0, 8)],
  }

  analytics.writeDataPoint(dataPoint)
}

export function getTimeRangeFilter(range: string): { value: string, unit: string } {
  const intervals: Record<string, { value: string, unit: string }> = {
    '1h': { value: '1', unit: 'HOUR' },
    '24h': { value: '24', unit: 'HOUR' },
    '7d': { value: '7', unit: 'DAY' },
    '30d': { value: '30', unit: 'DAY' },
    '90d': { value: '90', unit: 'DAY' },
    '180d': { value: '180', unit: 'DAY' },
  }
  return intervals[range] || intervals['24h']!
}

const PROTOCOL_RE = /^https?:\/\//

async function persistToolOutcome(
  event: H3Event,
  tool: ToolId,
  url: string,
  outcome: { status: 'success' | 'error', durationMs: number, errorCode: string | null },
  strategy?: 'mobile' | 'desktop',
): Promise<void> {
  if (import.meta.dev)
    return

  let domain = url.trim()
  if (PROTOCOL_RE.test(domain))
    domain = new URL(domain).hostname

  const session = await getUserSession(event).catch((error) => {
    console.warn('[tool-analytics] Unable to resolve user session', error)
    return null
  })

  const db = getDB(event)
  await db.insert(toolLookups).values({
    userId: (session?.user as { id?: string } | undefined)?.id || null,
    sessionId: getSessionId(event),
    tool,
    query: domain,
    strategy,
    status: outcome.status,
    durationMs: outcome.durationMs,
    errorCode: outcome.errorCode,
  })
}

export function trackToolRequest<T>(
  event: H3Event,
  input: { tool: ToolId, url: string, strategy?: 'mobile' | 'desktop' },
  run: () => Promise<T>,
): Promise<T> {
  return runWithToolOutcome(run, async (outcome) => {
    await Promise.all([
      trackToolUsage(event, input.tool, 'use', {
        responseTime: outcome.durationMs,
        error: outcome.status === 'error',
      }).catch(error => console.error('[tool-analytics] Analytics Engine write failed', error)),
      persistToolOutcome(event, input.tool, input.url, outcome, input.strategy)
        .catch(error => console.error('[tool-analytics] D1 write failed', error)),
    ])
  })
}
