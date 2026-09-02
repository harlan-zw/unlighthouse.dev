/* eslint-disable test/no-import-node-test */
import type { ErrorReport, ReportPolicy } from '@harlan-zw/nuxt-sentry/server'
import assert from 'node:assert/strict'
import test from 'node:test'
import { decideReport } from '@harlan-zw/nuxt-sentry/server'
import { describeCruxFailure } from '../shared/crux-request.ts'
import { describePsiFailure } from '../shared/psi-request.ts'
import { EXPECTED_UPSTREAM_FAILURE_MESSAGE_RE, STACKLESS_FETCH_FAILURE_MESSAGE_RE, STACKLESS_NETWORK_ERROR_MESSAGE_RE } from '../shared/sentry.ts'

const upstreamErrors = [
  Object.assign(new Error('rate limited'), { response: { status: 429 } }),
  Object.assign(new Error('bad request'), { response: { status: 400 } }),
  Object.assign(new Error('fetch failed'), { response: { status: 500 } }),
  new Error('fetch failed'),
]

test('drops every PageSpeed Insights failure this site raises', () => {
  for (const error of upstreamErrors)
    assert.match(describePsiFailure(error).message, EXPECTED_UPSTREAM_FAILURE_MESSAGE_RE)
})

test('drops every Chrome UX Report failure this site raises', () => {
  for (const error of upstreamErrors)
    assert.match(describeCruxFailure(error).message, EXPECTED_UPSTREAM_FAILURE_MESSAGE_RE)
})

test('keeps a defect in this site', () => {
  assert.doesNotMatch('Cannot read properties of undefined', EXPECTED_UPSTREAM_FAILURE_MESSAGE_RE)
})

/** The client Report Policy this site configures, resolved the way the module resolves it. */
const clientPolicy: ReportPolicy = {
  scope: 'client',
  dataCollection: 'scrubbed',
  dropStatus: [],
  dropTransient: false,
  ignoreErrors: [],
  dropStacklessErrors: [
    {
      _tag: 'pattern',
      source: STACKLESS_FETCH_FAILURE_MESSAGE_RE.source,
      flags: STACKLESS_FETCH_FAILURE_MESSAGE_RE.flags,
    },
    {
      _tag: 'pattern',
      source: STACKLESS_NETWORK_ERROR_MESSAGE_RE.source,
      flags: STACKLESS_NETWORK_ERROR_MESSAGE_RE.flags,
    },
  ],
  dropBreadcrumbMessages: [],
  denyUrls: [],
  secretKeys: [],
}

function errorReport(type: string, value: string, frames: Array<{ filename: string }>): ErrorReport {
  return {
    exception: {
      values: [{
        type,
        value,
        stacktrace: { frames },
      }],
    },
  }
}

test('drops the app manifest fetch failure that carries no stack', () => {
  const decision = decideReport(errorReport('TypeError', 'Failed to fetch', []), undefined, clientPolicy)

  assert.deepEqual(decision, { _tag: 'drop', rule: 'stackless-message' })
})

test('keeps the same failure when a stack names site code', () => {
  const report = errorReport('TypeError', 'Failed to fetch', [{ filename: 'https://unlighthouse.dev/_nuxt/entry.js' }])

  assert.deepEqual(decideReport(report, undefined, clientPolicy), { _tag: 'send' })
})

test('drops the plain-http network error that carries no stack', () => {
  const decision = decideReport(errorReport('NetworkError', 'A network error occurred.', []), undefined, clientPolicy)

  assert.deepEqual(decision, { _tag: 'drop', rule: 'stackless-message' })
})

test('keeps the same network error when a stack names site code', () => {
  const report = errorReport('NetworkError', 'A network error occurred.', [{ filename: 'https://unlighthouse.dev/_nuxt/entry.js' }])

  assert.deepEqual(decideReport(report, undefined, clientPolicy), { _tag: 'send' })
})
