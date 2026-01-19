import type { H3Event } from 'h3'
import { appStorage } from '../storage'

interface RateLimiter {
  limit: (opts: { key: string }) => Promise<{ success: boolean }>
}

const FREE_TOOL_DAILY_LIMIT = 50

function getEndOfDayTimestamp(): number {
  const now = new Date()
  const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1))
  return Math.floor(endOfDay.getTime() / 1000)
}

export async function checkFreeToolRateLimit(event: H3Event) {
  // Skip rate limiting in development
  if (import.meta.dev)
    return

  const ip = getHeader(event, 'cf-connecting-ip')
    || getHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim()
    || getRequestIP(event)
    || 'unknown'
  const key = `ip:${ip}`

  // Per-minute check (native Cloudflare binding)
  const cf = event.context.cloudflare?.env as Record<string, RateLimiter> | undefined
  const limiter = cf?.RL_FREE_TOOLS

  if (limiter) {
    const { success } = await limiter.limit({ key })
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

  // Per-day check (KV storage)
  const today = new Date().toISOString().slice(0, 10)
  const dayKey = `ratelimit:tool:${key}:${today}`
  const storage = appStorage()

  const count = await storage.getItem<number>(dayKey).catch(() => null)

  if (count !== null && count >= FREE_TOOL_DAILY_LIMIT) {
    setResponseHeaders(event, {
      'X-RateLimit-Limit': String(FREE_TOOL_DAILY_LIMIT),
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': String(getEndOfDayTimestamp()),
    })
    throw createError({
      statusCode: 429,
      message: `Daily limit of ${FREE_TOOL_DAILY_LIMIT} requests exceeded. Resets at midnight UTC.`,
    })
  }

  await storage.setItem(dayKey, (count || 0) + 1, { ttl: 86400 }).catch(() => {})

  setResponseHeaders(event, {
    'X-RateLimit-Limit': String(FREE_TOOL_DAILY_LIMIT),
    'X-RateLimit-Remaining': String(FREE_TOOL_DAILY_LIMIT - (count || 0) - 1),
  })
}
