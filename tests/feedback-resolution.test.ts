/* eslint-disable test/no-import-node-test */
import type { FeedbackResolutionDatabase } from '../server/utils/feedback-resolution.ts'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { setFeedbackResolution } from '../server/utils/feedback-resolution.ts'

const migrations = ['0001_initial.sql', '0005_feedback_resolved_at.sql'].map(file => readFileSync(
  fileURLToPath(new URL(`../server/database/migrations/${file}`, import.meta.url)),
  'utf8',
))

/**
 * Real SQLite, the engine D1 runs, so the UPDATE and its change count behave
 * the way production reports them.
 */
function sqliteDatabase(): FeedbackResolutionDatabase & { close: () => void, resolvedAt: (id: string) => number | null } {
  const db = new DatabaseSync(':memory:')
  for (const migration of migrations)
    db.exec(migration)
  db.prepare(`INSERT INTO feedback (id, path, comment, created_at) VALUES ('fb-1', '/api-doc', 'doc is incomplete', 100)`).run()
  return {
    prepare: sql => ({
      bind: (...values) => ({
        run: async () => {
          await Promise.resolve()
          const { changes } = db.prepare(sql).run(...values as never[]) as { changes: number }
          return { meta: { changes } }
        },
      }),
    }),
    resolvedAt: id => (db.prepare('SELECT resolved_at AS at FROM feedback WHERE id = ?').get(id) as { at: number | null }).at,
    close: () => db.close(),
  }
}

test('resolving stamps the comment with the clock', async () => {
  const db = sqliteDatabase()
  try {
    const result = await setFeedbackResolution(db, { id: 'fb-1', resolved: true }, () => 5000)
    assert.deepEqual(result, { _tag: 'Ok', id: 'fb-1', resolvedAt: 5000 })
    assert.equal(db.resolvedAt('fb-1'), 5000)
  }
  finally {
    db.close()
  }
})

test('reopening clears the stamp', async () => {
  const db = sqliteDatabase()
  try {
    await setFeedbackResolution(db, { id: 'fb-1', resolved: true }, () => 5000)
    const result = await setFeedbackResolution(db, { id: 'fb-1', resolved: false }, () => 6000)
    assert.deepEqual(result, { _tag: 'Ok', id: 'fb-1', resolvedAt: null })
    assert.equal(db.resolvedAt('fb-1'), null)
  }
  finally {
    db.close()
  }
})

test('an unknown id is an error value, not a silent no-op', async () => {
  const db = sqliteDatabase()
  try {
    const result = await setFeedbackResolution(db, { id: 'missing', resolved: true }, () => 5000)
    assert.deepEqual(result, { _tag: 'Err', reason: 'not-found' })
    assert.equal(db.resolvedAt('fb-1'), null)
  }
  finally {
    db.close()
  }
})
