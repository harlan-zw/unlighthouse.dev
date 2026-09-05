/**
 * Pure health scoring for `/api/health`.
 *
 * The endpoint reads production counters; this module turns them into a verdict.
 * Keeping the decision pure means every threshold is unit tested without D1, and
 * the daily check-in can replay an archived payload through the same rules.
 */

export type HealthStatus = 'GREEN' | 'AMBER' | 'RED'

export type Probe<T>
  = | { _tag: 'ok', value: T }
    | { _tag: 'error', message: string }

export interface FeedbackWindow {
  total: number
  up: number
  down: number
  comments: number
}

export interface ToolWindow {
  lookups: number
  /** Lookups that recorded an outcome. Page loads write a row with no status. */
  statused: number
  errors: number
  slow: number
  avgDurationMs: number | null
  maxDurationMs: number | null
}

export interface ToolBreakdown {
  tool: string
  lookups: number
  statused: number
  errors: number
  /** Distinct targets behind those errors. One target is a bad URL, not an outage. */
  errorQueries: number
  /** Per-tool durations, so a slow window can be pinned on a named tool. */
  avgDurationMs: number | null
  maxDurationMs: number | null
}

export interface HealthMetrics {
  feedback: {
    last24h: FeedbackWindow
    last7d: FeedbackWindow
    lastAt: number | null
  }
  tools: {
    last24h: ToolWindow
    /** The six days before the current window, used as the traffic baseline. */
    prior6d: ToolWindow
    byTool: ToolBreakdown[]
  }
}

export interface HealthInput {
  database: Probe<HealthMetrics>
}

export interface HealthSummary {
  status: HealthStatus
  reasons: string[]
  warnings: string[]
}

function count(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : 0
}

function optional(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : null
}

/**
 * Boundary parsers turn one aggregate D1 row into a precise payload type, so
 * the SQL column names live in exactly one tested place.
 */

function parseFeedbackWindow(row: Record<string, unknown>, suffix: string): FeedbackWindow {
  return {
    total: count(row[`total${suffix}`]),
    up: count(row[`up${suffix}`]),
    down: count(row[`down${suffix}`]),
    comments: count(row[`comments${suffix}`]),
  }
}

export function parseFeedbackMetrics(row: Record<string, unknown>): HealthMetrics['feedback'] {
  return {
    last24h: parseFeedbackWindow(row, '24h'),
    last7d: parseFeedbackWindow(row, '7d'),
    lastAt: optional(row.last_at),
  }
}

export function parseToolWindow(row: Record<string, unknown> | undefined): ToolWindow {
  return {
    lookups: count(row?.lookups),
    statused: count(row?.statused),
    errors: count(row?.errors),
    slow: count(row?.slow),
    avgDurationMs: optional(row?.avg_ms),
    maxDurationMs: optional(row?.max_ms),
  }
}

export function parseToolBreakdown(row: Record<string, unknown> | undefined): ToolBreakdown {
  return {
    tool: String(row?.tool ?? 'unknown'),
    lookups: count(row?.lookups),
    statused: count(row?.statused),
    errors: count(row?.errors),
    errorQueries: count(row?.error_queries),
    avgDurationMs: optional(row?.avg_ms),
    maxDurationMs: optional(row?.max_ms),
  }
}

interface Finding {
  status: HealthStatus
  message: string
}

export const HEALTH_THRESHOLDS = {
  /** Below this many recorded outcomes a rate is noise, not a signal. */
  minStatusedForRate: 10,
  amberErrorRate: 0.25,
  redErrorRate: 0.5,
  /** A single tool needs fewer samples to convict, because it fails whole. */
  minToolStatusedForRate: 5,
  slowDurationMs: 10_000,
  /** Traffic below this share of the daily baseline reads as a silent outage. */
  trafficDropRatio: 0.25,
  minBaselineDailyLookups: 20,
} as const

const SEVERITY: Record<HealthStatus, number> = { GREEN: 0, AMBER: 1, RED: 2 }

function worst(a: HealthStatus, b: HealthStatus): HealthStatus {
  return SEVERITY[b] > SEVERITY[a] ? b : a
}

function percent(part: number, whole: number): string {
  return whole > 0 ? `${Math.round((part / whole) * 100)}%` : '0%'
}

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`
}

/**
 * Feedback is the reason this endpoint exists, so any unanswered signal moves
 * the verdict rather than sitting in a warning list nobody reads.
 */
function feedbackFindings(feedback: HealthMetrics['feedback']): { findings: Finding[], warnings: string[] } {
  const findings: Finding[] = []
  const warnings: string[] = []

  if (feedback.last24h.comments > 0)
    findings.push({ status: 'AMBER', message: `${plural(feedback.last24h.comments, 'feedback comment', 'feedback comments')} awaiting a reply (last 24h)` })
  if (feedback.last24h.down > 0)
    findings.push({ status: 'AMBER', message: `${plural(feedback.last24h.down, 'thumbs-down vote', 'thumbs-down votes')} awaiting triage (last 24h)` })

  const rated7d = feedback.last7d.up + feedback.last7d.down
  if (rated7d >= 5 && feedback.last7d.down / rated7d > 0.5)
    warnings.push(`7-day feedback is ${percent(feedback.last7d.down, rated7d)} negative across ${rated7d} votes`)

  return { findings, warnings }
}

function toolFindings(tools: HealthMetrics['tools']): { findings: Finding[], warnings: string[] } {
  const findings: Finding[] = []
  const warnings: string[] = []
  const { last24h, prior6d, byTool } = tools

  if (last24h.statused >= HEALTH_THRESHOLDS.minStatusedForRate) {
    const rate = last24h.errors / last24h.statused
    const message = `Tool error rate is ${percent(last24h.errors, last24h.statused)} over ${last24h.statused} recorded runs`
    if (rate >= HEALTH_THRESHOLDS.redErrorRate)
      findings.push({ status: 'RED', message })
    else if (rate >= HEALTH_THRESHOLDS.amberErrorRate)
      findings.push({ status: 'AMBER', message })
  }

  // One broken tool hides inside a healthy site-wide rate: cwv-check erroring on
  // 4 of 6 runs is 15% of a 26-run day and would otherwise pass unreported.
  //
  // Errors concentrated on a single target are a different fact. On 2026-08-13
  // all four cwv-check failures were one visitor retrying one URL that upstream
  // answered 400. That visitor still got nothing, so it is worth saying, but the
  // tool works and calling it an outage teaches the report to be ignored.
  for (const tool of byTool) {
    if (tool.statused < HEALTH_THRESHOLDS.minToolStatusedForRate)
      continue
    const rate = tool.errors / tool.statused
    if (rate < HEALTH_THRESHOLDS.amberErrorRate)
      continue
    const share = `${tool.errors} of ${tool.statused} recorded runs (${percent(tool.errors, tool.statused)})`
    if (tool.errorQueries <= 1) {
      warnings.push(`Tool ${tool.tool} errored on ${share}, all for one target`)
      continue
    }
    findings.push({
      status: rate >= HEALTH_THRESHOLDS.redErrorRate ? 'RED' : 'AMBER',
      message: `Tool ${tool.tool} errored on ${share} across ${tool.errorQueries} targets`,
    })
  }

  // A dead window is only meaningful against a baseline that proves traffic
  // exists, otherwise every quiet night reads as an outage.
  const baselineDaily = prior6d.lookups / 6
  if (baselineDaily >= HEALTH_THRESHOLDS.minBaselineDailyLookups
    && last24h.lookups < baselineDaily * HEALTH_THRESHOLDS.trafficDropRatio) {
    findings.push({ status: 'AMBER', message: `Tool traffic fell to ${last24h.lookups} lookups against a ${Math.round(baselineDaily)}/day baseline` })
  }

  // The tools wrap PageSpeed Insights, which is slow by nature, so duration is a
  // warning with the average alongside it rather than a verdict on its own.
  if (last24h.slow > 0) {
    const average = last24h.avgDurationMs === null ? '' : `, average ${Math.round(last24h.avgDurationMs / 100) / 10}s`
    warnings.push(`${plural(last24h.slow, 'lookup', 'lookups')} of ${last24h.statused} took over ${HEALTH_THRESHOLDS.slowDurationMs / 1000}s${average}, slowest ${last24h.maxDurationMs}ms`)
  }

  return { findings, warnings }
}

export function summarizeHealth(input: HealthInput): HealthSummary {
  if (input.database._tag === 'error') {
    return {
      status: 'RED',
      reasons: [`Database probe failed: ${input.database.message}`],
      warnings: [],
    }
  }

  const metrics = input.database.value
  const feedback = feedbackFindings(metrics.feedback)
  const tools = toolFindings(metrics.tools)
  const findings = [...tools.findings, ...feedback.findings]

  return {
    // Red first, so the top line of any report is the worst thing that is true.
    status: findings.reduce<HealthStatus>((carry, finding) => worst(carry, finding.status), 'GREEN'),
    reasons: [...findings].sort((a, b) => SEVERITY[b.status] - SEVERITY[a.status]).map(finding => finding.message),
    warnings: [...tools.warnings, ...feedback.warnings],
  }
}
