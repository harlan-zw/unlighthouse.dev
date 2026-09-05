/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import test from 'node:test'
import { humanDate } from '../app/utils/format.ts'

test('formats a UTC-midnight date identically under UTC and negative offsets', () => {
  const underUtc = withTimeZone('UTC', () => humanDate('2026-09-05'))
  const underNewYork = withTimeZone('America/New_York', () => humanDate('2026-09-05'))

  assert.equal(underUtc, 'Sep 5, 2026')
  assert.equal(underNewYork, underUtc)
})

test('formats a UTC-midnight datetime identically under negative offsets', () => {
  const underUtc = withTimeZone('UTC', () => humanDate('2026-09-05T00:00:00Z'))
  const underLosAngeles = withTimeZone('America/Los_Angeles', () => humanDate('2026-09-05T00:00:00Z'))

  assert.equal(underUtc, 'Sep 5, 2026')
  assert.equal(underLosAngeles, underUtc)
})

function withTimeZone(timeZone: string, run: () => string): string {
  const previous = process.env.TZ
  process.env.TZ = timeZone
  try {
    return run()
  }
  finally {
    if (previous === undefined)
      delete process.env.TZ
    else
      process.env.TZ = previous
  }
}
