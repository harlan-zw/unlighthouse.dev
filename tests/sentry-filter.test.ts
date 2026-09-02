/* eslint-disable test/no-import-node-test */
import type { ErrorReport, ReportPolicy } from '@harlan-zw/nuxt-sentry/server'
import assert from 'node:assert/strict'
import test from 'node:test'
import { decideReport } from '@harlan-zw/nuxt-sentry/server'
import { describeCruxFailure } from '../shared/crux-request.ts'
import { describePsiFailure } from '../shared/psi-request.ts'
import { EXPECTED_UPSTREAM_FAILURE_MESSAGE_RE, STACKLESS_FETCH_FAILURE_MESSAGE_RE, STACKLESS_UNHANDLED_REJECTION_EVENT_MESSAGE_RE, STACKLESS_UNHANDLED_REJECTION_OBJECT_MESSAGE_RE } from '../shared/sentry.ts'

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
  }, {
    _tag: 'pattern',
    source: STACKLESS_UNHANDLED_REJECTION_EVENT_MESSAGE_RE.source,
    flags: STACKLESS_UNHANDLED_REJECTION_EVENT_MESSAGE_RE.flags,
  }, {
    _tag: 'pattern',
    source: STACKLESS_UNHANDLED_REJECTION_OBJECT_MESSAGE_RE.source,
    flags: STACKLESS_UNHANDLED_REJECTION_OBJECT_MESSAGE_RE.flags,
  }],
  dropBreadcrumbMessages: [],
  denyUrls: [],
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

/**
 * The report Sentry's browser SDK synthesizes for the Safari unhandledrejection CustomEvent.
 *
 * The SDK reads no stack from the event, so the exception value it records is the
 * `CustomEvent: …` text below with an empty frame list.
 */
function unhandledRejectionEventReport(frames: Array<{ filename: string }>): ErrorReport {
  return {
    exception: {
      values: [{
        type: 'CustomEvent',
        value: 'Event `CustomEvent` (type=unhandledrejection) captured as promise rejection',
        stacktrace: { frames },
      }],
    },
  }
}

test('drops the Safari unhandledrejection CustomEvent that carries no stack', () => {
  const decision = decideReport(unhandledRejectionEventReport([]), undefined, clientPolicy)

  assert.deepEqual(decision, { _tag: 'drop', rule: 'stackless-message' })
})

test('keeps the same rejection event when a stack names site code', () => {
  const report = unhandledRejectionEventReport([{ filename: 'https://unlighthouse.dev/_nuxt/entry.js' }])

  assert.deepEqual(decideReport(report, undefined, clientPolicy), { _tag: 'send' })
})

/**
 * The report Sentry's browser SDK synthesizes when a plain object reaches the global
 * rejection handler.
 *
 * The SDK stringifies the object into the message tail, so the key list varies. The
 * exception value it records is the `UnhandledRejection: Object captured …` text below
 * with an empty frame list.
 */
function unhandledRejectionObjectReport(frames: Array<{ filename: string }>): ErrorReport {
  return {
    exception: {
      values: [{
        type: 'UnhandledRejection',
        value: 'Object captured as promise rejection with keys: [object Object]',
        stacktrace: { frames },
      }],
    },
  }
}

test('drops the frameless unhandledrejection object rejection', () => {
  const decision = decideReport(unhandledRejectionObjectReport([]), undefined, clientPolicy)

  assert.deepEqual(decision, { _tag: 'drop', rule: 'stackless-message' })
})

test('keeps the same object rejection when a stack names site code', () => {
  const report = unhandledRejectionObjectReport([{ filename: 'https://unlighthouse.dev/_nuxt/entry.js' }])

  assert.deepEqual(decideReport(report, undefined, clientPolicy), { _tag: 'send' })
})
