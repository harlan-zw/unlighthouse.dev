/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { runWithToolOutcome } from '../server/utils/tool-outcome.ts'
import { toolCatalog } from '../shared/tool-catalog.ts'

test('tool catalog exposes one canonical analytics id per tool', () => {
  const ids = toolCatalog.map(tool => tool.id)

  assert.equal(new Set(ids).size, ids.length)
  assert.ok(ids.includes('lcp'))
  assert.ok(ids.includes('cls'))
  assert.ok(ids.includes('inp'))
  assert.ok(ids.includes('cwv-check'))
  assert.ok(!ids.includes('lcp-finder'))
  assert.ok(!ids.includes('cls-debugger'))
  assert.ok(!ids.includes('inp-analyzer'))
})

test('records a successful tool outcome after completion', async () => {
  const outcomes: unknown[] = []
  const times = [100, 145]

  const value = await runWithToolOutcome(
    async () => 'result',
    async outcome => outcomes.push(outcome),
    () => times.shift()!,
  )

  assert.equal(value, 'result')
  assert.deepEqual(outcomes, [{ status: 'success', durationMs: 45, errorCode: null }])
})

test('records a failed tool outcome and preserves the original error', async () => {
  const outcomes: unknown[] = []
  const times = [200, 223]
  const error = Object.assign(new Error('rate limited'), { statusCode: 429 })

  await assert.rejects(
    runWithToolOutcome(
      async () => Promise.reject(error),
      async outcome => outcomes.push(outcome),
      () => times.shift()!,
    ),
    candidate => candidate === error,
  )

  assert.deepEqual(outcomes, [{ status: 'error', durationMs: 23, errorCode: '429' }])
})

test('admin lookup totals and fields reflect the full D1 result shape', async () => {
  const [route, page] = await Promise.all([
    readFile(new URL('../layers/admin/server/api/admin/tool-lookups.get.ts', import.meta.url), 'utf8'),
    readFile(new URL('../layers/admin/app/pages/admin/index.vue', import.meta.url), 'utf8'),
  ])

  assert.match(route, /count\(\*\).*total/is)
  assert.doesNotMatch(route, /total:\s*lookups\.length/)
  assert.match(page, /accessorKey:\s*'sessionId'/)
  assert.match(page, /accessorKey:\s*'status'/)
  assert.match(page, /accessorKey:\s*'createdAt'/)
  assert.doesNotMatch(page, /const lookupTools = \[/)
})

test('analytics migration stores outcomes and canonicalizes feedback ids', async () => {
  const migration = await readFile(new URL('../server/database/migrations/0003_tool_outcomes.sql', import.meta.url), 'utf8')

  assert.match(migration, /ADD COLUMN status TEXT/)
  assert.match(migration, /ADD COLUMN duration_ms INTEGER/)
  assert.match(migration, /lcp-finder.+lcp/is)
  assert.match(migration, /cls-debugger.+cls/is)
  assert.match(migration, /inp-analyzer.+inp/is)
})
