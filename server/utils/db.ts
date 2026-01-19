import type { H3Event } from 'h3'
import { drizzle } from 'drizzle-orm/d1'
import * as schema from '../database/schema'

export function useDB(event: H3Event) {
  const d1 = (event.context.cloudflare?.env as { DB?: D1Database } | undefined)?.DB
  if (!d1)
    throw createError({ statusCode: 500, message: 'Database not available' })
  return drizzle(d1, { schema })
}
