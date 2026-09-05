/* eslint-disable test/no-import-node-test */
import type { ErrorReport, ReportPolicy } from '@harlan-zw/nuxt-sentry/server'
import assert from 'node:assert/strict'
import test from 'node:test'
import { decideReport } from '@harlan-zw/nuxt-sentry/server'
import { describeCruxFailure } from '../shared/crux-request.ts'
import { describePsiFailure } from '../shared/psi-request.ts'
import {
  CARBONADS_SCRIPT_ELEMENT_RE,
  CARBONADS_VENDOR_ORIGIN_RE,
  EXPECTED_UPSTREAM_FAILURE_MESSAGE_RE,
  STACKLESS_FETCH_FAILURE_MESSAGE_RE,
  STACKLESS_NETWORK_ERROR_MESSAGE_RE,
  STACKLESS_NON_ERROR_REJECTION_DROP_RULE,
} from '../shared/sentry.ts'

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
  ignoreErrors: [{
    _tag: 'pattern',
    source: CARBONADS_SCRIPT_ELEMENT_RE.source,
    flags: CARBONADS_SCRIPT_ELEMENT_RE.flags,
  }],
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
    {
      _tag: 'pattern',
      source: STACKLESS_NON_ERROR_REJECTION_DROP_RULE.source,
      flags: STACKLESS_NON_ERROR_REJECTION_DROP_RULE.flags,
    },
  ],
  dropBreadcrumbMessages: [],
  denyUrls: [{
    _tag: 'pattern',
    source: CARBONADS_VENDOR_ORIGIN_RE.source,
    flags: CARBONADS_VENDOR_ORIGIN_RE.flags,
  }],
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

// UNLIGHTHOUSE-D is a DOMException with code 19, which Sentry labels `Error`, so the
// message it matches carries an extra `Error: ` prefix over the sighting above.
test('drops the DOMException network error that carries no stack', () => {
  const decision = decideReport(errorReport('Error', 'NetworkError: A network error occurred.', []), undefined, clientPolicy)

  assert.deepEqual(decision, { _tag: 'drop', rule: 'stackless-message' })
})

test('keeps the DOMException network error when a stack names site code', () => {
  const report = errorReport('Error', 'NetworkError: A network error occurred.', [{ filename: 'https://unlighthouse.dev/_nuxt/entry.js' }])

  assert.deepEqual(decideReport(report, undefined, clientPolicy), { _tag: 'send' })
})

/** A rejection whose captured value is not an `Error`, the way Sentry serializes it. */
function nonErrorRejectionReport(type: string, value: string, frames: Array<{ filename: string }> = []): ErrorReport {
  return {
    exception: {
      values: [{ type, value, stacktrace: { frames } }],
    },
  }
}

/** The client report the Carbon Ads vendor script raises when an ad blocker removed its tag. */
function carbonAdsFailureReport(): ErrorReport {
  return {
    exception: {
      values: [{
        type: 'TypeError',
        value: 'null is not an object (evaluating \'document.getElementById("_carbonads_js").src\')',
        stacktrace: { frames: [] },
      }],
    },
  }
}

test('drops the Carbon Ads non-Error rejections that carry no stack', () => {
  const customEvent = nonErrorRejectionReport(
    'CustomEvent',
    'Event `CustomEvent` (type=unhandledrejection) captured as promise rejection',
  )
  const plainObject = nonErrorRejectionReport(
    'UnhandledRejection',
    'Object captured as promise rejection with keys: [object has no keys]',
  )

  for (const report of [customEvent, plainObject])
    assert.deepEqual(decideReport(report, undefined, clientPolicy), { _tag: 'drop', rule: 'stackless-message' })
})

test('keeps the same rejection when a stack names site code', () => {
  const report = nonErrorRejectionReport(
    'UnhandledRejection',
    'Object captured as promise rejection with keys: [object has no keys]',
    [{ filename: 'https://unlighthouse.dev/_nuxt/entry.js' }],
  )

  assert.deepEqual(decideReport(report, undefined, clientPolicy), { _tag: 'send' })
})

test('drops the carbon ads element failure an ad blocker raises', () => {
  const decision = decideReport(carbonAdsFailureReport(), undefined, clientPolicy)

  assert.deepEqual(decision, { _tag: 'drop', rule: 'ignore-message' })
})

test('keeps a site defect whose null element read never names the carbon ad', () => {
  const report: ErrorReport = {
    exception: {
      values: [{
        type: 'TypeError',
        value: 'Cannot read properties of null (reading \'src\')',
        stacktrace: { frames: [{ filename: 'https://unlighthouse.dev/_nuxt/entry.js' }] },
      }],
    },
  }

  assert.deepEqual(decideReport(report, undefined, clientPolicy), { _tag: 'send' })
})

/**
 * The same vendor failure as the Safari report above, worded the way Chrome's V8 words it.
 * V8 omits the evaluated expression from the message, so the message never names the
 * element id and only the stack frame names the vendor origin.
 */
function carbonAdsChromeFailureReport(): ErrorReport {
  return {
    exception: {
      values: [{
        type: 'TypeError',
        value: 'Cannot read properties of null (reading \'src\')',
        stacktrace: {
          frames: [{
            filename: 'https://cdn.carbonads.com/carbon.js?serve=CW7DTKJL&placement=unlighthousedev',
          }],
        },
      }],
    },
  }
}

test('drops the chrome worded carbon ads failure whose every frame is vendor side', () => {
  const decision = decideReport(carbonAdsChromeFailureReport(), undefined, clientPolicy)

  assert.deepEqual(decision, { _tag: 'drop', rule: 'deny-url' })
})
