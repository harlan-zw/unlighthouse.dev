import type { D1Database } from '@cloudflare/workers-types'
import type { CloudflareRequest } from './worker-env'
import { drizzle } from 'drizzle-orm/d1'
import { createError } from 'h3'
import { getWorkerEnv } from './worker-env'

/**
 * The raw binding, for callers that report on a missing database instead of
 * failing the request. `getDB` remains the path for handlers that need one.
 */
export function getD1(event: CloudflareRequest): D1Database | null {
  return getWorkerEnv<{ DB: D1Database }>(event)?.DB ?? null
}

export function getDB(event: CloudflareRequest) {
  const d1 = getD1(event) as Parameters<typeof drizzle>[0] | null
  if (!d1)
    throw createError({ statusCode: 500, message: 'Database not available' })
  return drizzle(d1)
}
