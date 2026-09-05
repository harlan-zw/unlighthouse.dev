import type { H3Event } from 'h3'
import { isTransientD1Error } from '@harlan-zw/nuxt-cloudflare/d1'
import { createError, getHeader, getRequestIP, setResponseHeaders } from 'h3'

interface RateLimiter {
  limit: (opts: { key: string }) => Promise<{ success: boolean }>
}

/**
 * One atomic increment of a counter that expires.
 *
 * The counter must survive concurrent callers in different Worker isolates, so
 * the implementation gets exactly one round trip to do the read, the add and
 * the write. Anything that reads first and writes second opens the window this
 * store exists to close, which is why the daily counts no longer sit in KV.
 */
export interface RateLimitStore {
  /**
   * Adds 1 to the counter and returns the new value.
   *
   * A counter whose window has passed restarts at 1 and takes the new
   * `expiresAt`, so a caller never inherits yesterday's total.
   */
  incrementItem: (key: string, opts: { expiresAt: number }) => Promise<number>
}

/** The slice of D1 this store uses, so a test can supply a database of its own. */
export interface RateLimitDatabase {
  prepare: (sql: string) => {
    bind: (...values: unknown[]) => {
      first: <T>(column: string) => Promise<T | null>
      run: () => Promise<{ meta: { changes: number } }>
    }
  }
}

/** The one statement the store runs. SQLite applies it atomically. */
const INCREMENT_SQL = `
INSERT INTO rate_limits (key, count, expires_at) VALUES (?1, 1, ?2)
ON CONFLICT(key) DO UPDATE SET
  count = CASE WHEN rate_limits.expires_at <= ?3 THEN 1 ELSE rate_limits.count + 1 END,
  expires_at = CASE WHEN rate_limits.expires_at <= ?3 THEN ?2 ELSE rate_limits.expires_at END
RETURNING count
`

const FREE_TOOL_DAILY_LIMIT = 50
export const FEEDBACK_DAILY_LIMIT = 10

export function createRateLimitStore(
  db: RateLimitDatabase,
  now: () => number = () => Math.floor(Date.now() / 1000),
): RateLimitStore {
  return {
    incrementItem: async (key, { expiresAt }) => {
      const count = await db.prepare(INCREMENT_SQL).bind(key, expiresAt, now()).first<number>('count')
      if (count === null)
        throw new Error('Rate limit counter returned no row')
      return count
    },
  }
}

/**
 * Deletes every counter whose window has passed and returns how many rows went.
 *
 * The upsert reuses one row per subject, but a subject that stops calling
 * leaves its row behind, and D1 keeps every row forever where KV expired them
 * through TTL. The scheduled task calls this on each cron tick so the table
 * cannot grow without bound, and `expires_at` is indexed for exactly this
 * scan.
 *
 * `expires_at <= now` matches the upsert's restart rule, so a row is gone by
 * the time the next increment would have reset it.
 */
export async function deleteExpiredRateLimits(
  db: RateLimitDatabase,
  now: () => number = () => Math.floor(Date.now() / 1000),
): Promise<number> {
  const { meta } = await db
    .prepare('DELETE FROM rate_limits WHERE expires_at <= ?1')
    .bind(now())
    .run()
  return meta.changes
}

function getEndOfDayTimestamp(): number {
  const now = new Date()
  const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1))
  return Math.floor(endOfDay.getTime() / 1000)
}

/**
 * The store backed by this request's D1 binding, or null when no binding is present.
 *
 * This reads the binding directly rather than through `getDB`, because the
 * counter runs one statement of its own and needs no ORM or schema.
 */
function requestRateLimitStore(event: H3Event): RateLimitStore | null {
  const env = event.context.cloudflare?.env as { DB?: RateLimitDatabase } | undefined
  return env?.DB ? createRateLimitStore(env.DB) : null
}

export function getRequestIp(event: H3Event): string {
  return getHeader(event, 'cf-connecting-ip')
    || getHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim()
    || getRequestIP(event)
    || 'unknown'
}

/** How many times a transient failure is retried before the limit gives up. */
const COUNT_RETRY_DELAYS_MS = [25, 75]

/**
 * Increments the counter, retrying only the failures worth retrying.
 *
 * A session reset or a transient D1 error is a blip, and giving up on the first
 * one hands the caller a free request. A permanent error, a missing table for
 * example, repeats no matter how often it is asked, so it fails fast rather
 * than spending a round trip per attempt on every request.
 *
 * Returns null once the counter is judged unreachable.
 */
async function countRequest(store: RateLimitStore, key: string): Promise<number | null> {
  const expiresAt = getEndOfDayTimestamp()

  for (let attempt = 0; ; attempt++) {
    try {
      return await store.incrementItem(key, { expiresAt })
    }
    catch (error) {
      if (!isTransientD1Error(error)) {
        console.warn('[rate-limit] The counter failed and will not recover; allowing the request', error)
        return null
      }
      const delay = COUNT_RETRY_DELAYS_MS[attempt]
      if (delay === undefined) {
        console.warn('[rate-limit] The counter kept failing; allowing the request', error)
        return null
      }
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}

/**
 * Counts one request against a daily limit and rejects the caller past it.
 *
 * Both daily limits run through here, so the atomic increment is the only way
 * a daily count is kept. A counter that cannot be read or written lets the
 * request through: a broken counter must not become a 429 for every visitor.
 */
async function enforceDailyLimit(event: H3Event, options: {
  store: RateLimitStore | null
  key: string
  limit: number
  message: string
}): Promise<void> {
  const { store, key, limit, message } = options

  if (!store) {
    console.warn('[rate-limit] No database binding; the daily limit is not enforced')
    return
  }

  const count = await countRequest(store, key)

  // A counter that cannot be reached leaves the limit unenforced for this
  // request. That is the safer failure: a broken counter must not turn into a
  // 429 for every visitor.
  if (count === null)
    return

  if (count > limit) {
    setResponseHeaders(event, {
      'X-RateLimit-Limit': String(limit),
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': String(getEndOfDayTimestamp()),
    })
    throw createError({ statusCode: 429, message })
  }

  setResponseHeaders(event, {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(limit - count),
  })
}

export async function checkFreeToolRateLimit(event: H3Event, store: RateLimitStore | null = requestRateLimitStore(event)) {
  // Skip rate limiting in development
  if (import.meta.dev)
    return

  const ip = getRequestIp(event)

  // Per-minute check (native Cloudflare binding)
  const cf = event.context.cloudflare?.env as Record<string, RateLimiter> | undefined
  const limiter = cf?.RL_FREE_TOOLS

  if (limiter) {
    const { success } = await limiter.limit({ key: `ip:${ip}` })
    if (!success) {
      setResponseHeaders(event, {
        'X-RateLimit-Limit': String(FREE_TOOL_DAILY_LIMIT),
        'Retry-After': '60',
      })
      throw createError({
        statusCode: 429,
        message: 'Rate limit exceeded. Please wait before making more requests.',
      })
    }
  }

  await enforceDailyLimit(event, {
    store,
    key: `ratelimit:tool:ip:${ip}`,
    limit: FREE_TOOL_DAILY_LIMIT,
    message: `Daily limit of ${FREE_TOOL_DAILY_LIMIT} requests exceeded. Resets at midnight UTC.`,
  })
}

export async function checkFeedbackRateLimit(event: H3Event, store: RateLimitStore | null = requestRateLimitStore(event)) {
  // Skip rate limiting in development
  if (import.meta.dev)
    return

  await enforceDailyLimit(event, {
    store,
    key: `ratelimit:feedback:ip:${getRequestIp(event)}`,
    limit: FEEDBACK_DAILY_LIMIT,
    message: `Daily limit of ${FEEDBACK_DAILY_LIMIT} feedback submissions exceeded. Resets at midnight UTC.`,
  })
}
