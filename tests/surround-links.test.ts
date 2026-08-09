/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import test from 'node:test'
import { buildSurroundLinks } from '../utils/surround-links.ts'

test('keeps the next relation when the previous article is absent', () => {
  assert.deepEqual(
    buildSurroundLinks([null, { path: '/learn-lighthouse/performance/lcp' }], 'https://unlighthouse.dev'),
    [{ rel: 'next', href: 'https://unlighthouse.dev/learn-lighthouse/performance/lcp' }],
  )
})

test('keeps previous and next relations in their source positions', () => {
  assert.deepEqual(
    buildSurroundLinks([
      { path: '/learn-lighthouse/performance/cls' },
      { path: '/learn-lighthouse/performance/inp' },
    ], 'https://unlighthouse.dev'),
    [
      { rel: 'prev', href: 'https://unlighthouse.dev/learn-lighthouse/performance/cls' },
      { rel: 'next', href: 'https://unlighthouse.dev/learn-lighthouse/performance/inp' },
    ],
  )
})
