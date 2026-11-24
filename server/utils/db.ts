import type { D1Database } from '@cloudflare/workers-types'
import type { RequestEvent } from 'nuxt/server'
import { drizzle } from 'drizzle-orm/d1'
import { createError } from 'h3'

/**
 * The raw binding, for callers that report on a missing database instead of
 * failing the request. `getDB` remains the path for handlers that need one.
 */
export function getD1(event: Pick<RequestEvent, 'context'>): D1Database | null {
  const cloudflare = event.context.cloudflare as { env?: { DB?: D1Database } } | undefined
  return cloudflare?.env?.DB ?? null
}

export function getDB(event: Pick<RequestEvent, 'context'>) {
  const d1 = getD1(event) as Parameters<typeof drizzle>[0] | null
  if (!d1)
    throw createError({ statusCode: 500, message: 'Database not available' })
  return drizzle(d1)
}
