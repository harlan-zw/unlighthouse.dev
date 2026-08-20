/* eslint-disable test/no-import-node-test */
import type { ErrorReport, ReportPolicy } from '@harlan-zw/nuxt-sentry/server'
import assert from 'node:assert/strict'
import test from 'node:test'
import { createClientNoiseOptions, decideReport } from '@harlan-zw/nuxt-sentry/server'
import { describeCruxFailure } from '../shared/crux-request.ts'
import { describePsiFailure } from '../shared/psi-request.ts'
import { CARBON_ADS_SCRIPT_URL_RE, EXPECTED_UPSTREAM_FAILURE_MESSAGE_RE, STACKLESS_FETCH_FAILURE_MESSAGE_RE } from '../shared/sentry.ts'

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
  dropStacklessErrors: [{
    _tag: 'pattern',
    source: STACKLESS_FETCH_FAILURE_MESSAGE_RE.source,
    flags: STACKLESS_FETCH_FAILURE_MESSAGE_RE.flags,
  }],
  dropBreadcrumbMessages: [],
  denyUrls: [{
    _tag: 'pattern',
    source: CARBON_ADS_SCRIPT_URL_RE.source,
    flags: CARBON_ADS_SCRIPT_URL_RE.flags,
  }],
  secretKeys: [],
}

function fetchFailureReport(frames: Array<{ filename: string }>): ErrorReport {
  return {
    exception: {
      values: [{
        type: 'TypeError',
        value: 'Failed to fetch',
        stacktrace: { frames },
      }],
    },
  }
}

test('drops the app manifest fetch failure that carries no stack', () => {
  const decision = decideReport(fetchFailureReport([]), undefined, clientPolicy)

  assert.deepEqual(decision, { _tag: 'drop', rule: 'stackless-message' })
})

test('keeps the same failure when a stack names site code', () => {
  const report = fetchFailureReport([{ filename: 'https://unlighthouse.dev/_nuxt/entry.js' }])

  assert.deepEqual(decideReport(report, undefined, clientPolicy), { _tag: 'send' })
})

/** The frame the ad script crashes in after the site unmounts its script element. */
const CARBON_ADS_FRAME_URL = 'https://cdn.carbonads.com/carbon.js'

test('drops an error the ad script raises', () => {
  const { denyUrls } = createClientNoiseOptions(clientPolicy)

  assert.ok(denyUrls.some(pattern => pattern.test(CARBON_ADS_FRAME_URL)))
})

test('keeps an error a site chunk raises', () => {
  const { denyUrls } = createClientNoiseOptions(clientPolicy)

  assert.ok(!denyUrls.some(pattern => pattern.test('https://unlighthouse.dev/_nuxt/entry.js')))
})
