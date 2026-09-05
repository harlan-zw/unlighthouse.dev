/* eslint-disable test/no-import-node-test */
import type { RateLimitDatabase } from '../server/utils/rate-limit.ts'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { createRateLimitStore, deleteExpiredRateLimits } from '../server/utils/rate-limit.ts'

const migration = readFileSync(
  fileURLToPath(new URL('../server/database/migrations/0004_rate_limits.sql', import.meta.url)),
  'utf8',
)

/**
 * Real SQLite, the engine D1 runs, so the DELETE removes what production
 * would, including the number of rows it reports.
 */
function sqliteDatabase(): RateLimitDatabase & { close: () => void, rowCount: () => number } {
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
        run: async () => {
          await Promise.resolve()
          const { changes } = db.prepare(sql).run(...values as never[]) as { changes: number }
          return { meta: { changes } }
        },
      }),
    }),
    rowCount: () => (db.prepare('SELECT COUNT(*) AS n FROM rate_limits').get() as { n: number }).n,
    close: () => db.close(),
  }
}

test('deletes every counter whose window has passed', async () => {
  const db = sqliteDatabase()
  try {
    let clock = 1000
    const store = createRateLimitStore(db, () => clock)
    await store.incrementItem('ratelimit:tool:ip:203.0.113.1', { expiresAt: 2000 })
    await store.incrementItem('ratelimit:feedback:ip:203.0.113.2', { expiresAt: 2000 })

    clock = 2001
    assert.equal(await deleteExpiredRateLimits(db, () => clock), 2)
    assert.equal(db.rowCount(), 0)
  }
  finally {
    db.close()
  }
})

test('deletes only the expired counters when the table holds both', async () => {
  const db = sqliteDatabase()
  try {
    let clock = 1000
    const store = createRateLimitStore(db, () => clock)
    await store.incrementItem('ratelimit:tool:ip:203.0.113.1', { expiresAt: 2000 })
    await store.incrementItem('ratelimit:feedback:ip:203.0.113.2', { expiresAt: 5000 })

    clock = 3000
    assert.equal(await deleteExpiredRateLimits(db, () => clock), 1)
    assert.equal(db.rowCount(), 1)
    // The surviving counter still counts.
    assert.equal(await store.incrementItem('ratelimit:feedback:ip:203.0.113.2', { expiresAt: 5000 }), 2)
  }
  finally {
    db.close()
  }
})

test('keeps every counter while no window has passed', async () => {
  const db = sqliteDatabase()
  try {
    const store = createRateLimitStore(db, () => 1000)
    await store.incrementItem('ratelimit:tool:ip:203.0.113.1', { expiresAt: 2000 })

    assert.equal(await deleteExpiredRateLimits(db, () => 1500), 0)
    assert.equal(db.rowCount(), 1)
  }
  finally {
    db.close()
  }
})
