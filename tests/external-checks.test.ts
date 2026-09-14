/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import { it } from 'node:test'
import { evaluateWorkers, evaluateWorkflows } from '../checks/lib/evidence.mjs'

it('fails completed CI failures and retains workflow evidence', () => {
  const workflows = [{ name: 'Deploy', state: { _tag: 'failure', consecutiveFailures: 2 } }]
  assert.deepEqual(evaluateWorkflows(workflows), {
    _tag: 'Fail',
    reason: 'A workflow failed.',
    evidence: { workflows },
  })
})

it('cannot mark missing workflow evidence healthy', () => {
  assert.equal(evaluateWorkflows([{ name: 'Deploy', state: { _tag: 'missing' } }])._tag, 'Unavailable')
})

it('keeps pending workflows visible', () => {
  assert.equal(evaluateWorkflows([{ name: 'Deploy', state: { _tag: 'pending', consecutiveFailures: 0 } }])._tag, 'Warn')
})

it('keeps non-success Worker outcomes visible', () => {
  assert.equal(evaluateWorkers({ errors: 0, nonOk: [{ status: 'exceededCpu', requests: 1 }], outcomes: {} })._tag, 'Warn')
  assert.equal(evaluateWorkers({ errors: 2, nonOk: [], outcomes: {} })._tag, 'Warn')
  assert.equal(evaluateWorkers({ errors: 0, nonOk: [], outcomes: { success: 8 } })._tag, 'Pass')
})

it('retains CI failure evidence when another workflow is missing', () => {
  const workflows = [
    { name: 'Deploy', state: { _tag: 'failure', consecutiveFailures: 1 } },
    { name: 'Test', state: { _tag: 'missing' } },
  ]
  assert.deepEqual(evaluateWorkflows(workflows), {
    _tag: 'Fail',
    reason: 'A workflow failed.',
    coverage: 'incomplete',
    evidence: { workflows },
  })
})
