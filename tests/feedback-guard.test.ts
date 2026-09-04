/* eslint-disable test/no-import-node-test */
import type { H3Event } from 'h3'
import assert from 'node:assert/strict'
import test from 'node:test'
import { checkFeedbackRateLimit, FEEDBACK_DAILY_LIMIT } from '../server/utils/rate-limit.ts'
import { CommentFeedbackSchema, ThumbsFeedbackSchema } from '../types/schemas.ts'

function createEvent(ip: string): H3Event {
  return {
    node: {
      req: { headers: {}, socket: { remoteAddress: ip } },
      res: { setHeader: () => {} },
    },
    context: {},
  } as unknown as H3Event
}

function createMemoryStore() {
  const entries = new Map<string, unknown>()
  return {
    entries,
    async getItem(key: string) {
      return entries.get(key) ?? null
    },
    async setItem(key: string, value: unknown) {
      entries.set(key, value)
    },
  }
}

test('feedback throttle counts submissions per ip until the daily limit', async () => {
  const store = createMemoryStore()
  const event = createEvent('203.0.113.10')

  for (let i = 0; i < FEEDBACK_DAILY_LIMIT; i++)
    await checkFeedbackRateLimit(event, store)

  await assert.rejects(
    checkFeedbackRateLimit(event, store),
    error => (error as { statusCode?: number }).statusCode === 429,
  )
  assert.equal(store.entries.size, 1)
})

test('feedback throttle tracks each ip in its own bucket', async () => {
  const store = createMemoryStore()

  await checkFeedbackRateLimit(createEvent('203.0.113.10'), store)
  await checkFeedbackRateLimit(createEvent('203.0.113.11'), store)

  assert.equal(store.entries.size, 2)
})

test('comment feedback schema bounds the context record', () => {
  const comment = 'Great tool, thanks'

  assert.equal(
    CommentFeedbackSchema.safeParse({ comment, context: { url: 'https://example.test', strategy: 'mobile' } }).success,
    true,
  )
  assert.equal(
    CommentFeedbackSchema.safeParse({ comment, context: { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11 } }).success,
    false,
  )
  assert.equal(
    CommentFeedbackSchema.safeParse({ comment, context: { spam: 'x'.repeat(301) } }).success,
    false,
  )
  assert.equal(
    CommentFeedbackSchema.safeParse({ comment, context: { spam: { deep: 'object' } } }).success,
    false,
  )
  assert.equal(
    CommentFeedbackSchema.safeParse({ comment, context: { ['k'.repeat(41)]: 'ok' } }).success,
    false,
  )
})

test('comment feedback schema bounds stored metadata fields', () => {
  const comment = 'Great tool, thanks'

  assert.equal(CommentFeedbackSchema.safeParse({ comment, path: '/'.repeat(501) }).success, false)
  assert.equal(CommentFeedbackSchema.safeParse({ comment, toolId: 't'.repeat(101) }).success, false)
  assert.equal(CommentFeedbackSchema.safeParse({ comment, thumbFeedbackId: 'i'.repeat(101) }).success, false)
})

test('thumbs feedback schema bounds the context record', () => {
  assert.equal(
    ThumbsFeedbackSchema.safeParse({ thumbs: 'up', context: { url: 'https://example.test', urls: ['https://a.test', 'https://b.test'] } }).success,
    true,
  )
  assert.equal(
    ThumbsFeedbackSchema.safeParse({ thumbs: 'up', context: { urls: Array.from({ length: 21 }, (_, i) => `https://${i}.test`) } }).success,
    false,
  )
  assert.equal(
    ThumbsFeedbackSchema.safeParse({ thumbs: 'up', context: { spam: 'y'.repeat(301) } }).success,
    false,
  )
})
