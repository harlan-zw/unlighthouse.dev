import type { HealthSummary } from './health'
import { fail, pass, unavailable, warn } from '@harlan-zw/nuxt-checkin/server'

export function evaluateHealthCheck(summary: HealthSummary & { metrics: unknown }) {
  if (summary.metrics === null)
    return unavailable(summary.reasons.join(' ') || 'Database health evidence is unavailable.')
  const evidence = JSON.parse(JSON.stringify(summary))
  if (summary.status === 'RED')
    return fail(summary.reasons.join(' '), evidence)
  if (summary.status === 'AMBER')
    return warn(summary.reasons.join(' '), evidence)
  return pass(evidence)
}
