/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import test from 'node:test'
import { assessFieldCoreWebVitalRatings, assessFieldCoreWebVitals } from '../shared/field-assessment.ts'

test('allows field assessment with measured good LCP and CLS when INP is unavailable', () => {
  assert.deepEqual(assessFieldCoreWebVitals({ lcp: 2200, cls: 0.05 }), {
    _tag: 'Passed',
    goodMetricCount: 2,
    measuredMetricCount: 2,
    missingMetrics: ['inp'],
  })
})

test('does not turn missing required field metrics into a failed assessment', () => {
  assert.equal(assessFieldCoreWebVitals({ inp: 100 })._tag, 'Unavailable')
  assert.equal(assessFieldCoreWebVitals({})._tag, 'Unavailable')
  assert.equal(assessFieldCoreWebVitals({ lcp: 1000, cls: Number.NaN })._tag, 'Unavailable')
})

test('fails when any available Core Web Vital misses its good threshold', () => {
  assert.equal(assessFieldCoreWebVitals({ lcp: 2500, cls: 0.1, inp: 201 })._tag, 'Failed')
  assert.equal(assessFieldCoreWebVitals({ lcp: 2501, cls: 0.1 })._tag, 'Failed')
  assert.equal(assessFieldCoreWebVitals({ lcp: 2500, cls: 0.1, inp: 200 })._tag, 'Passed')
})

test('uses authoritative field ratings and leaves unknown ratings unavailable', () => {
  assert.equal(assessFieldCoreWebVitalRatings({ lcp: 'good', cls: 'good' })._tag, 'Passed')
  assert.equal(assessFieldCoreWebVitalRatings({ lcp: 'good', cls: 'good', inp: 'poor' })._tag, 'Failed')
  assert.equal(assessFieldCoreWebVitalRatings({ lcp: 'good', cls: 'unknown' })._tag, 'Unavailable')
  assert.equal(assessFieldCoreWebVitalRatings({ lcp: 'good', cls: 'good', inp: 'unknown' })._tag, 'Unavailable')
})
