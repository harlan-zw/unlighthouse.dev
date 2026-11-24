import { runChecks } from '@harlan-zw/nuxt-checkin/server'
import { defineEventHandler, setResponseHeader } from 'h3'
import checks from '#checkin/checks'
import { requiredChecks } from '../../shared/checkin'
import { getWorkerEnv } from '../utils/worker-env'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'cache-control', 'no-store')
  const metadata = getWorkerEnv<{ CF_VERSION_METADATA: { id?: string } }>(event)?.CF_VERSION_METADATA
  return runChecks(checks, {
    event,
    identity: metadata?.id ? { site: 'unlighthouse.dev', environment: 'production', deployment: metadata.id } : undefined,
    required: requiredChecks,
    totalTimeoutMs: 15_000,
    timeoutMs: 12_000,
  })
})
