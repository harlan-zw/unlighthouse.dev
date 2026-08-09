/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import test from 'node:test'
import { searchContentEntries } from '../utils/content-search.ts'

const entries = [
  {
    id: '/learn-lighthouse/inp',
    title: 'Interaction to Next Paint (INP) Guide',
    titles: [],
    content: 'Diagnose slow interactions and improve responsiveness.',
    level: 1,
  },
  {
    id: '/tools/inp-analyzer',
    title: 'INP Analyzer',
    titles: [],
    content: 'Analyze Interaction to Next Paint phases.',
    level: 1,
  },
]

test('finds Learn content by multi-word title', () => {
  const results = searchContentEntries(entries, 'Interaction to Next Paint', 10)

  assert.equal(results[0]?.id, '/learn-lighthouse/inp')
})

test('respects the result limit', () => {
  assert.equal(searchContentEntries(entries, 'INP', 1).length, 1)
})
