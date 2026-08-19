/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import test from 'node:test'
import { parseHar } from '../layers/tools/app/utils/har.ts'

function harEntry(overrides: Record<string, unknown> = {}) {
  return {
    startedDateTime: '2026-08-17T20:59:00.000Z',
    time: 120,
    request: { url: 'https://example.com/app.js', method: 'GET', httpVersion: 'h2' },
    response: { status: 200, content: { size: 2048, mimeType: 'text/javascript' } },
    timings: { blocked: 10, dns: 5, connect: 5, ssl: 0, send: 0, wait: 80, receive: 20 },
    ...overrides,
  }
}

test('rejects text that is not JSON without throwing', () => {
  const result = parseHar('not json at all')

  assert.equal(result._tag, 'Err')
  assert.equal(result._tag === 'Err' && result.reason, 'invalid-json')
})

test('rejects a JSON document with no log entries', () => {
  const result = parseHar(JSON.stringify({ log: { version: '1.2' } }))

  assert.equal(result._tag, 'Err')
  assert.equal(result._tag === 'Err' && result.reason, 'invalid-har')
})

test('rejects a HAR whose entries are not a list', () => {
  const result = parseHar(JSON.stringify({ log: { entries: { url: 'https://example.com' } } }))

  assert.equal(result._tag, 'Err')
  assert.equal(result._tag === 'Err' && result.reason, 'invalid-har')
})

test('parses a HAR into totals a reader can act on', () => {
  const result = parseHar(JSON.stringify({
    log: {
      version: '1.2',
      pages: [{ id: 'page_1', title: 'Example', pageTimings: { onLoad: 900 } }],
      entries: [
        harEntry(),
        harEntry({
          startedDateTime: '2026-08-17T20:59:00.500Z',
          request: { url: 'https://cdn.example.org/logo.png', method: 'GET', httpVersion: 'h2' },
          response: { status: 304, content: { size: 512, mimeType: 'image/png' } },
        }),
      ],
    },
  }))

  assert.equal(result._tag, 'Ok')
  if (result._tag !== 'Ok')
    return

  assert.equal(result.report.totalRequests, 2)
  assert.equal(result.report.totalSize, 2560)
  assert.equal(result.report.pages[0]?.title, 'Example')
  assert.equal(result.report.cacheStats.hits, 1)
  assert.deepEqual(
    result.report.domainBreakdown.map(domain => domain.domain).sort(),
    ['cdn.example.org', 'example.com'],
  )
})

test('keeps an entry with no request object out of the report instead of failing', () => {
  const result = parseHar(JSON.stringify({
    log: { entries: [harEntry(), { startedDateTime: '2026-08-17T20:59:01.000Z' }] },
  }))

  assert.equal(result._tag, 'Ok')
  assert.equal(result._tag === 'Ok' && result.report.totalRequests, 1)
})
