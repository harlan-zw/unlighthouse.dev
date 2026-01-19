import type { H3Event } from 'h3'
import type { ToolName } from '../database/schema'
import { toolLookups } from '../database/schema'
import { useDB } from './db'

export interface AnalyticsDataPoint {
  blobs: string[]
  doubles: number[]
  indexes?: string[]
}

export function getAnalyticsEngine(event: H3Event): AnalyticsEngineDataset | undefined {
  return (event.context.cloudflare?.env as { TOOL_ANALYTICS?: AnalyticsEngineDataset } | undefined)?.TOOL_ANALYTICS
}

export async function trackToolUsage(
  event: H3Event,
  toolId: string,
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

  const sessionId = getCookie(event, 'analytics-session') || crypto.randomUUID()
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
  }
  return intervals[range] || intervals['24h']
}

export async function trackToolLookup(
  event: H3Event,
  tool: ToolName,
  url: string,
  strategy?: 'mobile' | 'desktop',
): Promise<void> {
  // Skip in dev mode when D1 may not be available
  if (import.meta.dev)
    return

  // Extract domain from URL
  let domain = url.trim()
  if (domain.match(/^https?:\/\//)) {
    const parsed = new URL(domain).hostname
    domain = parsed
  }

  const session = await getUserSession(event).catch(() => null)

  useDB(event).insert(toolLookups).values({
    userId: session?.user?.id || null,
    tool,
    query: domain,
    strategy,
  }).catch(err => console.error('Failed to track tool lookup:', err))
}
