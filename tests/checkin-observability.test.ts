/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import test from 'node:test'
import { summarizeWorkflowRuns } from '../scripts/tools/checkin-observability.mjs'

function run(status, conclusion) {
  return { workflowName: 'Deploy to Cloudflare', status, conclusion }
}

test('a skipped run keeps the deploy gate green', () => {
  const [workflow] = summarizeWorkflowRuns([
    run('completed', 'skipped'),
    run('completed', 'skipped'),
    run('completed', 'success'),
  ], ['Deploy to Cloudflare'])

  assert.deepEqual(workflow.state, { _tag: 'success' })
})

test('a timed_out deploy run is a failure, not a green gate', () => {
  const [workflow] = summarizeWorkflowRuns([
    run('completed', 'timed_out'),
    run('completed', 'success'),
  ], ['Deploy to Cloudflare'])

  assert.deepEqual(workflow.state, { _tag: 'failure', consecutiveFailures: 1 })
})

test('a startup_failure deploy run is a failure, not missing', () => {
  const [workflow] = summarizeWorkflowRuns([
    run('completed', 'startup_failure'),
  ], ['Deploy to Cloudflare'])

  assert.deepEqual(workflow.state, { _tag: 'failure', consecutiveFailures: 1 })
})

test('a newer skipped run does not mask an older deploy failure', () => {
  const [workflow] = summarizeWorkflowRuns([
    run('completed', 'skipped'),
    run('completed', 'failure'),
  ], ['Deploy to Cloudflare'])

  assert.deepEqual(workflow.state, { _tag: 'failure', consecutiveFailures: 1 })
})

test('skipped and cancelled runs carry no verdict, so the gate reads missing', () => {
  const [workflow] = summarizeWorkflowRuns([
    run('completed', 'skipped'),
    run('completed', 'cancelled'),
  ], ['Deploy to Cloudflare'])

  assert.deepEqual(workflow.state, { _tag: 'missing' })
})

test('consecutive failures stop at a skipped run, not only at a success', () => {
  const [workflow] = summarizeWorkflowRuns([
    run('completed', 'failure'),
    run('completed', 'skipped'),
    run('completed', 'success'),
  ], ['Deploy to Cloudflare'])

  assert.deepEqual(workflow.state, { _tag: 'failure', consecutiveFailures: 1 })
})

test('real consecutive failures still count', () => {
  const [workflow] = summarizeWorkflowRuns([
    run('completed', 'failure'),
    run('completed', 'failure'),
    run('completed', 'success'),
  ], ['Deploy to Cloudflare'])

  assert.deepEqual(workflow.state, { _tag: 'failure', consecutiveFailures: 2 })
})
