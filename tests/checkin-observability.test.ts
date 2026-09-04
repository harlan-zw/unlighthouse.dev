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
