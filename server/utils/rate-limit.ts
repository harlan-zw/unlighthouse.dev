import type { H3Event } from 'h3'
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

  const count = await store.incrementItem(key, { expiresAt: getEndOfDayTimestamp() }).catch((error) => {
    console.warn('[rate-limit] Failed to count the request; allowing it', error)
    return null
  })

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
