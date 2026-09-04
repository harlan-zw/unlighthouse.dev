import type { H3Event } from 'h3'
import { createError, getHeader, getRequestIP, setResponseHeaders } from 'h3'
import { appStorage } from '../storage.ts'

interface RateLimiter {
  limit: (opts: { key: string }) => Promise<{ success: boolean }>
}

export interface RateLimitStore {
  getItem: (key: string) => Promise<unknown>
  setItem: (key: string, value: unknown, opts?: { ttl?: number }) => Promise<unknown>
}

const FREE_TOOL_DAILY_LIMIT = 50
export const FEEDBACK_DAILY_LIMIT = 10

function getEndOfDayTimestamp(): number {
  const now = new Date()
  const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1))
  return Math.floor(endOfDay.getTime() / 1000)
}

export function getRequestIp(event: H3Event): string {
  return getHeader(event, 'cf-connecting-ip')
    || getHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim()
    || getRequestIP(event)
    || 'unknown'
}

export async function checkFreeToolRateLimit(event: H3Event) {
  // Skip rate limiting in development
  if (import.meta.dev)
    return

  const key = `ip:${getRequestIp(event)}`

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

  const count = await storage.getItem<number>(dayKey).catch((error) => {
    console.warn('[rate-limit] Failed to read the daily count; using the native limiter only', error)
    return null
  })

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

  await storage.setItem(dayKey, (count || 0) + 1, { ttl: 86400 }).catch((error) => {
    console.warn('[rate-limit] Failed to persist daily count', error)
  })

  setResponseHeaders(event, {
    'X-RateLimit-Limit': String(FREE_TOOL_DAILY_LIMIT),
    'X-RateLimit-Remaining': String(FREE_TOOL_DAILY_LIMIT - (count || 0) - 1),
  })
}

export async function checkFeedbackRateLimit(event: H3Event, store: RateLimitStore = appStorage()) {
  // Skip rate limiting in development
  if (import.meta.dev)
    return

  const today = new Date().toISOString().slice(0, 10)
  const dayKey = `ratelimit:feedback:ip:${getRequestIp(event)}:${today}`

  const count = await store.getItem(dayKey).catch((error) => {
    console.warn('[rate-limit] Failed to read the feedback count; allowing the request', error)
    return null
  })

  if (count !== null && Number(count) >= FEEDBACK_DAILY_LIMIT) {
    setResponseHeaders(event, {
      'X-RateLimit-Limit': String(FEEDBACK_DAILY_LIMIT),
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': String(getEndOfDayTimestamp()),
    })
    throw createError({
      statusCode: 429,
      message: `Daily limit of ${FEEDBACK_DAILY_LIMIT} feedback submissions exceeded. Resets at midnight UTC.`,
    })
  }

  await store.setItem(dayKey, (Number(count) || 0) + 1, { ttl: 86400 }).catch((error) => {
    console.warn('[rate-limit] Failed to persist feedback count', error)
  })

  setResponseHeaders(event, {
    'X-RateLimit-Limit': String(FEEDBACK_DAILY_LIMIT),
    'X-RateLimit-Remaining': String(FEEDBACK_DAILY_LIMIT - (Number(count) || 0) - 1),
  })
}
