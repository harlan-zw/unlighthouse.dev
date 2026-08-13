import type { D1Database } from '@cloudflare/workers-types'
import type { HealthMetrics, HealthSummary, Probe, ToolBreakdown } from '../utils/health'
import { getD1 } from '../utils/db'
import { summarizeHealth } from '../utils/health'

/**
 * Operational health for the daily check-in and for uptime probes.
 *
 * The response is always HTTP 200: `status` carries the verdict. A non-200 here
 * would mean the site itself is down, which is a different fact from "feedback
 * is waiting" or "a tool is erroring", and the two must stay distinguishable.
 *
 * The payload is aggregate only. Feedback text, session ids, and user ids never
 * leave D1 through this route, because it is public.
 */

const DAY_SECONDS = 24 * 60 * 60
const SLOW_MS = 10_000
const TOP_TOOLS = 12

interface HealthResponse extends HealthSummary {
  generatedAt: string
  release: string | null
  window: { from: string, to: string }
  metrics: HealthMetrics | null
}

function count(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : 0
}

function optional(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : null
}

function feedbackWindow(row: Record<string, unknown>, suffix: string) {
  return {
    total: count(row[`total${suffix}`]),
    up: count(row[`up${suffix}`]),
    down: count(row[`down${suffix}`]),
    comments: count(row[`comments${suffix}`]),
  }
}

function toolWindow(row: Record<string, unknown> | undefined) {
  return {
    lookups: count(row?.lookups),
    statused: count(row?.statused),
    errors: count(row?.errors),
    slow: count(row?.slow),
    avgDurationMs: optional(row?.avg_ms),
    maxDurationMs: optional(row?.max_ms),
  }
}

async function readMetrics(db: D1Database, nowSeconds: number): Promise<Probe<HealthMetrics>> {
  const dayAgo = nowSeconds - DAY_SECONDS
  const weekAgo = nowSeconds - 7 * DAY_SECONDS

  const toolWindowSql = `SELECT
      COUNT(*) AS lookups,
      COALESCE(SUM(status IS NOT NULL), 0) AS statused,
      COALESCE(SUM(status = 'error'), 0) AS errors,
      COALESCE(SUM(duration_ms > ?), 0) AS slow,
      AVG(duration_ms) AS avg_ms,
      MAX(duration_ms) AS max_ms
    FROM tool_lookups WHERE created_at >= ?`

  const batch = await db.batch<Record<string, unknown>>([
    db.prepare(`SELECT
        COALESCE(SUM(created_at >= ?1), 0) AS total24h,
        COALESCE(SUM(created_at >= ?1 AND thumb = 'up'), 0) AS up24h,
        COALESCE(SUM(created_at >= ?1 AND thumb = 'down'), 0) AS down24h,
        COALESCE(SUM(created_at >= ?1 AND comment IS NOT NULL AND comment != ''), 0) AS comments24h,
        COALESCE(SUM(created_at >= ?2), 0) AS total7d,
        COALESCE(SUM(created_at >= ?2 AND thumb = 'up'), 0) AS up7d,
        COALESCE(SUM(created_at >= ?2 AND thumb = 'down'), 0) AS down7d,
        COALESCE(SUM(created_at >= ?2 AND comment IS NOT NULL AND comment != ''), 0) AS comments7d,
        MAX(created_at) AS last_at
      FROM feedback`).bind(dayAgo, weekAgo),
    db.prepare(toolWindowSql).bind(SLOW_MS, dayAgo),
    db.prepare(`${toolWindowSql} AND created_at < ?`).bind(SLOW_MS, weekAgo, dayAgo),
    db.prepare(`SELECT tool,
        COUNT(*) AS lookups,
        COALESCE(SUM(status IS NOT NULL), 0) AS statused,
        COALESCE(SUM(status = 'error'), 0) AS errors
      FROM tool_lookups WHERE created_at >= ? GROUP BY tool ORDER BY lookups DESC LIMIT ?`).bind(dayAgo, TOP_TOOLS),
  ]).then(results => ({ _tag: 'ok' as const, results })).catch((error: unknown) => ({
    _tag: 'error' as const,
    message: error instanceof Error ? error.message : String(error),
  }))

  if (batch._tag === 'error')
    return batch

  const [feedbackResult, dayResult, baselineResult, byToolResult] = batch.results
  const feedbackRow = feedbackResult?.results?.[0] ?? {}

  return {
    _tag: 'ok',
    value: {
      feedback: {
        last24h: feedbackWindow(feedbackRow, '24h'),
        last7d: feedbackWindow(feedbackRow, '7d'),
        lastAt: optional(feedbackRow.last_at),
      },
      tools: {
        last24h: toolWindow(dayResult?.results?.[0]),
        prior6d: toolWindow(baselineResult?.results?.[0]),
        byTool: (byToolResult?.results ?? []).map((row): ToolBreakdown => ({
          tool: String(row.tool ?? 'unknown'),
          lookups: count(row.lookups),
          statused: count(row.statused),
          errors: count(row.errors),
        })),
      },
    },
  }
}

export default defineEventHandler(async (event): Promise<HealthResponse> => {
  const now = new Date()
  const nowSeconds = Math.floor(now.getTime() / 1000)
  const db = getD1(event)
  const database: Probe<HealthMetrics> = db
    ? await readMetrics(db, nowSeconds)
    : { _tag: 'error', message: 'D1 binding DB is not available' }

  const summary = summarizeHealth({ database })
  setResponseHeader(event, 'cache-control', 'no-store')

  return {
    ...summary,
    generatedAt: now.toISOString(),
    release: useRuntimeConfig(event).sentry?.release || null,
    window: {
      from: new Date((nowSeconds - DAY_SECONDS) * 1000).toISOString(),
      to: now.toISOString(),
    },
    metrics: database._tag === 'ok' ? database.value : null,
  }
})
