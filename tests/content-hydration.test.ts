/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import test from 'node:test'
import { markStyleTextAsHydrationSafe } from '../utils/content.ts'

test('allows harmless Shiki style text normalization during hydration', () => {
  const body = [
    ['p', {}, 'Example'],
    ['style', {}, 'html .shiki span { color: red; }'],
  ]

  markStyleTextAsHydrationSafe(body)

  assert.deepEqual(body[1], [
    'style',
    { textContent: 'html .shiki span { color: red; }' },
  ])
})
