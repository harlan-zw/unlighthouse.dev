/* eslint-disable test/no-import-node-test */
import type { H3Event } from 'h3'
import type { RateLimitDatabase, RateLimitStore } from '../server/utils/rate-limit.ts'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { checkFeedbackRateLimit, createRateLimitStore, FEEDBACK_DAILY_LIMIT } from '../server/utils/rate-limit.ts'

const migration = readFileSync(
  fileURLToPath(new URL('../server/database/migrations/0004_rate_limits.sql', import.meta.url)),
  'utf8',
)

/**
 * A database that runs the store's statement against real SQLite, which is the
 * engine D1 runs. Every call yields to the event loop before it touches the
 * database, so an implementation that read first and wrote second would let a
 * concurrent caller in between and hand both the same count.
 */
function sqliteDatabase(): RateLimitDatabase & { close: () => void } {
  const db = new DatabaseSync(':memory:')
  db.exec(migration)
  return {
    prepare: sql => ({
      bind: (...values) => ({
        first: async <T>(column: string) => {
          await Promise.resolve()
          const row = db.prepare(sql).get(...values as never[]) as Record<string, unknown> | undefined
          return (row?.[column] as T) ?? null
        },
      }),
    }),
    close: () => db.close(),
  }
}

/** A day away, so nothing under test crosses its own window. */
const tomorrow = Math.floor(Date.now() / 1000) + 86_400

/** An event carrying the header the limiter reads first, so no socket is needed. */
function fakeEvent(ip = '203.0.113.1'): H3Event {
  return {
    node: {
      req: { headers: { 'cf-connecting-ip': ip } },
      res: { setHeader: () => {}, getHeader: () => undefined, headersSent: false },
    },
  } as unknown as H3Event
}

/** A store whose counts the test drives directly. */
function countingStore(counts: number[]): RateLimitStore {
  let call = 0
  return { incrementItem: async () => counts[call++] ?? counts[counts.length - 1] ?? 0 }
}

test('counts each increment exactly once under concurrency', async () => {
  const db = sqliteDatabase()
  try {
    const store = createRateLimitStore(db)
    const counts = await Promise.all(
      Array.from({ length: 25 }, () => store.incrementItem('ip:one', { expiresAt: tomorrow })),
    )

    assert.deepEqual([...counts].sort((a, b) => a - b), Array.from({ length: 25 }, (_, i) => i + 1))
  }
  finally {
    db.close()
  }
})

test('tracks each key in its own counter', async () => {
  const db = sqliteDatabase()
  try {
    const store = createRateLimitStore(db)
    await store.incrementItem('ip:one', { expiresAt: tomorrow })
    await store.incrementItem('ip:one', { expiresAt: tomorrow })

    assert.equal(await store.incrementItem('ip:two', { expiresAt: tomorrow }), 1)
    assert.equal(await store.incrementItem('ip:one', { expiresAt: tomorrow }), 3)
  }
  finally {
    db.close()
  }
})

test('restarts the counter once the window has passed', async () => {
  const db = sqliteDatabase()
  try {
    let clock = 1000
    const store = createRateLimitStore(db, () => clock)
    assert.equal(await store.incrementItem('ip:one', { expiresAt: 2000 }), 1)
    assert.equal(await store.incrementItem('ip:one', { expiresAt: 2000 }), 2)

    clock = 2000
    assert.equal(await store.incrementItem('ip:one', { expiresAt: 3000 }), 1)
    assert.equal(await store.incrementItem('ip:one', { expiresAt: 3000 }), 2)
  }
  finally {
    db.close()
  }
})

test('rejects the submission that passes the daily feedback limit', async () => {
  const store = countingStore([FEEDBACK_DAILY_LIMIT + 1])

  await assert.rejects(
    () => checkFeedbackRateLimit(fakeEvent(), store),
    (error: { statusCode?: number }) => error.statusCode === 429,
  )
})

test('allows the submission that reaches the daily feedback limit', async () => {
  const store = countingStore([FEEDBACK_DAILY_LIMIT])

  await checkFeedbackRateLimit(fakeEvent(), store)
})

test('allows the submission when the counter fails', async () => {
  const store: RateLimitStore = { incrementItem: () => Promise.reject(new Error('D1 unavailable')) }

  await checkFeedbackRateLimit(fakeEvent(), store)
})

test('allows the submission when no database binding is present', async () => {
  await checkFeedbackRateLimit(fakeEvent(), null)
})
