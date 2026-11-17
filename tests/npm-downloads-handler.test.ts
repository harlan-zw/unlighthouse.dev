/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import test from 'node:test'
import { createError } from 'h3'
import { FetchError } from 'ofetch'
import { EXPECTED_UPSTREAM_FAILURE } from '../shared/sentry.ts'

// Nitro supplies these globals in production. Import after installing the test boundary.
const globals = globalThis as unknown as Record<string, unknown>
globals.defineCachedEventHandler = (handler: unknown) => handler
globals.createError = createError
const { default: handler } = await import('../server/api/npm/downloads.get.ts')

test('returns a controlled upstream failure when npm rate limits a refresh', async () => {
  const error = Object.assign(new FetchError('npm request failed'), {
    response: new Response(null, { status: 429 }),
  })
  globals.$fetch = async () => {
    throw error
  }

  await assert.rejects(handler(), {
    statusCode: 429,
    message: 'npm downloads are rate limited right now. Try again later.',
    data: { reason: EXPECTED_UPSTREAM_FAILURE, upstreamStatus: 429 },
  })
})

test('preserves unexpected fetch failures', async () => {
  for (const error of [
    new TypeError('fetch failed'),
    Object.assign(new FetchError('npm server failed'), { response: new Response(null, { status: 500 }) }),
    Object.assign(new FetchError('package missing'), { response: new Response(null, { status: 404 }) }),
  ]) {
    globals.$fetch = async () => {
      throw error
    }
    await assert.rejects(handler(), candidate => candidate === error)
  }
})

test('keeps the successful download totals', async () => {
  const downloads = [{ downloads: 900, day: new Date().toISOString().split('T')[0] }]
  globals.$fetch = async () => ({ downloads })

  assert.deepEqual(await handler(), {
    downloads,
    totalDownloads90: 900,
    totalDownloads30: 900,
    averageDownloads30: 30,
    averageDownloads90: 10,
    percentageChange: 200,
  })
})

test('keeps malformed responses visible as defects', async () => {
  globals.$fetch = async () => ({ downloads: null })

  await assert.rejects(handler(), TypeError)
})
