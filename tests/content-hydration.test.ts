/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import test from 'node:test'
import { markStyleTextAsHydrationSafe, prepareContentForHydration } from '../utils/content.ts'

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

test('prepares content without mutating the shared Nuxt payload', () => {
  const source = {
    body: {
      value: [
        ['p', {}, 'Example'],
        ['style', {}, 'html .shiki span { color: red; }'],
      ],
    },
  }

  const prepared = prepareContentForHydration(source)

  assert.deepEqual(prepared.body.value[1], [
    'style',
    { textContent: 'html .shiki span { color: red; }' },
  ])
  assert.deepEqual(source.body.value[1], [
    'style',
    {},
    'html .shiki span { color: red; }',
  ])
})
