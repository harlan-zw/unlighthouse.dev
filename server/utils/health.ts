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

  for (const tool of byTool) {
    if (tool.statused < HEALTH_THRESHOLDS.minToolStatusedForRate || tool.errors < tool.statused)
      continue
    findings.push({ status: 'RED', message: `Tool ${tool.tool} failed all ${tool.statused} recorded runs in the last 24h` })
  }

  // A dead window is only meaningful against a baseline that proves traffic
  // exists, otherwise every quiet night reads as an outage.
  const baselineDaily = prior6d.lookups / 6
  if (baselineDaily >= HEALTH_THRESHOLDS.minBaselineDailyLookups
    && last24h.lookups < baselineDaily * HEALTH_THRESHOLDS.trafficDropRatio) {
    findings.push({ status: 'AMBER', message: `Tool traffic fell to ${last24h.lookups} lookups against a ${Math.round(baselineDaily)}/day baseline` })
  }

  if (last24h.slow > 0)
    warnings.push(`${plural(last24h.slow, 'lookup', 'lookups')} took over ${HEALTH_THRESHOLDS.slowDurationMs / 1000}s, slowest ${last24h.maxDurationMs}ms`)

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
