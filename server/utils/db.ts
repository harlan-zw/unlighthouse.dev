import type { D1Database } from '@cloudflare/workers-types'
import type { H3Event } from 'h3'
import { drizzle } from 'drizzle-orm/d1'
import * as schema from '../database/schema'

/**
 * The raw binding, for callers that report on a missing database instead of
 * failing the request. `getDB` remains the path for handlers that need one.
 */
export function getD1(event: H3Event): D1Database | null {
  return ((event.context.cloudflare?.env as { DB?: D1Database } | undefined)?.DB) ?? null
}

export function getDB(event: H3Event) {
  const d1 = getD1(event) as Parameters<typeof drizzle>[0] | null
  if (!d1)
    throw createError({ statusCode: 500, message: 'Database not available' })
  return drizzle(d1, { schema })
}
