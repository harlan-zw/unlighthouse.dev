import { runChecks } from '@harlan-zw/nuxt-checkin/server'
import checks from '#checkin/checks'
import { requiredChecks } from '../../shared/checkin'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'cache-control', 'no-store')
  const metadata = event.context.cloudflare?.env?.CF_VERSION_METADATA as { id?: string } | undefined
  return runChecks(checks, {
    event,
    identity: metadata?.id ? { site: 'unlighthouse.dev', environment: 'production', deployment: metadata.id } : undefined,
    required: requiredChecks,
    totalTimeoutMs: 15_000,
    timeoutMs: 12_000,
  })
})
